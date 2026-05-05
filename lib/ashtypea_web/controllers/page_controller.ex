defmodule AshtypeaWeb.PageController do
  use AshtypeaWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end

  def index conn, _params do
    conn |> put_root_layout(html: {AshtypeaWeb.Layouts, :spa_root}) |> render(:index)
  end

  def react(conn, _params) do
    render(conn, :react)
  end
end
