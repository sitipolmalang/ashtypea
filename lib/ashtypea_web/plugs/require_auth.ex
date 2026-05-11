defmodule AshtypeaWeb.Plugs.RequireAuth do
  @moduledoc """
  Plug to require a logged-in user (uses `conn.assigns[:current_user]`).
  Redirects to the sign-in page when no user is present.
  """

  import Plug.Conn
  import Phoenix.Controller

  def init(opts), do: opts

  def call(conn, _opts) do
    if conn.assigns[:current_user] do
      conn
    else
      conn
      |> put_flash(:error, "Please sign in")
      |> redirect(to: "/sign-in")
      |> halt()
    end
  end
end
