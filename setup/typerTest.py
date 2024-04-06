import typer
from typing_extensions import Annotated

app = typer.Typer()

@app.command()
def hello():
    typer.secho("Hello world", color="green")

@app.command()
def echo(message: Annotated[str, typer.Argument()]):
    typer.echo(message)

if __name__ == "__main__":
    app()