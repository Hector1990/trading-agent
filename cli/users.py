"""CLI utility commands for managing web console users."""

import typer


app = typer.Typer(help="User management commands")


@app.command()
def create(
    username: str = typer.Option(..., prompt=True, help="新用户用户名"),
    password: str = typer.Option(
        ..., prompt=True, hide_input=True, confirmation_prompt=True, help="新用户密码"
    ),
):
    """Create a user for the web console."""

    from web.db import init_db as init_web_db, session_scope
    from web.auth import create_user as auth_create_user

    init_web_db()
    try:
        with session_scope() as db:
            auth_create_user(db, username, password)
        typer.secho(f"用户 {username} 创建成功", fg=typer.colors.GREEN)
    except ValueError as exc:
        typer.secho(f"创建失败：{exc}", fg=typer.colors.RED)
