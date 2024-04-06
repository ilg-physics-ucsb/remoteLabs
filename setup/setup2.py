import ipaddress
import typer
import shutil
from pathlib import Path
from ruamel.yaml import YAML
from typing_extensions import Annotated
from rich import print as rprint
import re
from pathvalidate import ValidationError, validate_filename
import subprocess
import os

# #Support Functions
def warning(message: str):
    """Prints a warning message in orange with an alert emoji."""
    rprint(f"⚠️ [orange1]{message}[/orange1] ⚠️")

def alert(message: str):
    """Prints a alerting message in red with an alert emoji."""
    rprint(f"🚨 [red]{message}[/red] 🚨")

app = typer.Typer()

homeDirectory = Path.home()
remoteLabsDirectory = homeDirectory / 'remoteLabs'
setupDirectory = remoteLabsDirectory / 'setup'
websitesDirectory = remoteLabsDirectory / 'Websites'
nginxTemplatePath = setupDirectory / "remla.conf"
nginxConfPath = Path("/etc/nginx/sites-available/remla.conf")
nginxConfLinkPath = Path("/etc/nginx/sites-enabled/remla.conf")
nginxAvailablePath = Path("/etc/nginx/sites-available")
nginxEnabledPath = Path("/etc/nginx/sites-enabled")
localhostConfLinkPath = nginxEnabledPath / "localhost.conf"

def validate_filename_custom(value: Path) -> Path:
    """Validate the filename to ensure it does not contain path separators."""
    if '/' in value or '\\' in value:
        warning("The lab name must not contain slashes")
        raise typer.BadParameter("Bad")
    else:
        try:
            validate_filename(value)
        except ValidationError:
            warning("Not a valid file name. Contains characters that are not allowed.")
            raise typer.BadParameter("Bad Filename")
    return value

def validate_host(value: str) -> str:
    """Validate the input as either a valid hostname or a valid IPv4 address."""
    # Attempt to validate as an IPv4 address
    try:
        ipaddress.ip_address(value)
        return value
    except ValueError:
        pass  # Not a valid IP address, try hostname validation next

    # Basic hostname validation (you can adjust the regex for stricter validation)
    if re.match(r"^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$", value):
        return value
    warning("Invalid hostname or IP address")
    raise typer.BadParameter("Invalid")


def validate_port(value: str) -> int:
    """Validate the input as a valid port number."""
    try:
        port = int(value)
    except ValueError:
        warning("Port must be an integer.")
        raise typer.BadParameter("Port value")

    if not 1 <= port <= 65535:
        warning("Port must be in the range 1-65535.")
        raise typer.BadParameter()

    return port
@app.command()
def new():
    if os.geteuid() != 0:
        alert("This script must be run as root.")
        raise typer.Exit()
    labName = typer.prompt("What is the name of the lab your would like to setup?", type=validate_filename_custom )
    labFileName = f"{labName}.yml"
    labFilePath = remoteLabsDirectory / labFileName
    # Keep track if we make the file.
    created = False
    if not labFilePath.exists():
        warning("The lab file does not exist.")
        if typer.confirm("Would you like to create a new lab file from a template?", abort=True):
            templatePath = setupDirectory / "labTemplate.yml"
            created = True
            try:
                shutil.copy(templatePath, labFilePath)
                typer.echo(f"Lab file {labFileName} created from template successfully.")
            except IOError as e:
                alert(f"Failed to create lab file from template: {e}")
                return
    else:
        typer.echo(f"Lab file for {labFileName} already exists.")

    # Reading the YAML file
    yaml = YAML()
    try:
        with open(labFilePath, 'r') as file:
            labConfig = yaml.load(file)
            typer.echo(f"Lab configuration for {labFileName} loaded successfully.")
    except Exception as e:
        warning(f"Failed to read lab file: {e}")

    hostNameOrIP = typer.prompt("Enter the hostname or IP address for hosting the lab", default=labConfig["experimentSettings"]["hostname"], type=validate_host)

    portNumber = typer.prompt("Enter the port you'd like to run on.", default=labConfig["experimentSettings"]["port"], type=validate_port)

    indexDefault = f"{labName}.html" if created else labConfig["experimentSettings"]["indexFile"]
    indexFile = typer.prompt("Enter the index file name.", default=indexDefault, type=validate_filename_custom)

    # Check if indexFile already exists in websitesDirectory
    indexPath = websitesDirectory / indexFile
    if not indexPath.exists():
        # Copy indexTemplate.html from setupDirectory to websitesDirectory as indexFile
        templatePath = setupDirectory / "indexTemplate.html"
        try:
            shutil.copy(templatePath, indexPath)
            typer.echo(f"Index file {indexFile} created from template successfully.")
        except IOError as e:
            alert(f"Failed to create index file from template: {e}")
            return
    else:
        typer.echo(f"Index file {indexFile} already exists.")

    try:
        # Read the content of the remla.conf template
        with open(nginxTemplatePath, 'r') as file:
            content = file.read()

        # Replace placeholders with user-provided values
        content = content.replace('<port>', str(portNumber))
        content = content.replace('<hostOrIp>', hostNameOrIP)
        content = content.replace('<indexFile>', indexFile)

        # Write the modified content to /etc/nginx/sites-available
        # Note: Writing to /etc/nginx/sites-available requires root permissions
        with open(nginxConfPath, 'w') as file:
            file.write(content)
        typer.echo("nginx configuration updated successfully.")
    except IOError as e:
        alert(f"Failed to update nginx configuration: {e}")
        return
    except Exception as e:
        alert(f"An unexpected error occurred: {e}")
        return

    try:
        # Check if a symbolic link for localhost.conf exists and remove it
        if localhostConfLinkPath.is_symlink():
            localhostConfLinkPath.unlink()
            typer.echo("Disabled symbolic link for localhost.conf successfully.")
        elif localhostConfLinkPath.exists():
            alert("Found a non-symlink file named localhost.conf in sites-enabled. Manual intervention required.")
            return

        try:
            # Ensure the symlink destination does not exist before creating a new one
            if nginxConfLinkPath.exists():
                nginxConfLinkPath.unlink()  # Remove the existing symlink if it exists

            # Create the symbolic link
            nginxConfLinkPath.symlink_to(nginxConfPath)
            typer.echo("Symbolic link for Nginx configuration created successfully.")

            # Reload Nginx to apply the changes
            subprocess.run(['sudo', 'systemctl', 'reload', 'nginx'], check=True)
            typer.echo("Nginx reloaded successfully.")

        except IOError as e:
            alert(f"Failed to create symbolic link for nginx configuration: {e}")
            return
        except subprocess.CalledProcessError as e:
            alert(f"Failed to reload Nginx: {e}")
            return
        except Exception as e:
            alert(f"An unexpected error occurred: {e}")
            return

    except Exception as e:
        alert(f"An error occurred while handling nginx configurations: {e}")
        return

    typer.echo("Everything is setup. Now you just need to run `remla start`")


@app.command()
def setupt(labName: Annotated[str, typer.Argument(..., help="Name lab configuration file in remoteLabs without .yml ending.")]):
    """
    Sets up the lab environment based on a provided configuration file.
    The argument should just be the name of the file without the .yml extension
    and should exist in the remoteLabs directory.
    """
    typer.echo("Starting setup process")
    config_file = remoteLabsDirectory / labName.with_suffix(".yml")
    # Check if the config file exists and load it
    if not config_file.exists():
        alert(f"The file, {labName.with_suffix('.yml')} does not exist in the remoteLabs directory.")
        raise typer.Exit(code=1)

    yaml = YAML()
    try:
        with open(config_file, 'r') as file:
            config = yaml.load(file)
    except Exception as e:
        typer.echo(f"Failed to read or parse the configuration file: {e}")
        raise typer.Exit(code=1)

    # Extract required information
    hostname = config.get("hostname")
    port = config.get("port")
    index_file = config.get("indexFile")

    # Validate extracted information (implement these validation functions based on your requirements)
    # validate_host(hostname)
    # validate_port(str(port))  # Assuming validate_port takes a string argument
    # validate_filename_custom(Path(index_file))  # Assuming this function is adjusted to work with Paths

    # Proceed with similar operations as in 'new', using the extracted config values
    # This includes copying templates, setting up Nginx, etc.

    typer.echo("Lab environment setup completed.")

if __name__ == "__main__":
    app()
