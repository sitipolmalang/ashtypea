defmodule AshtypeaWeb.AshTypescriptRpcController do
  use AshtypeaWeb, :controller

  def run(conn, params) do
    actor = conn.assigns[:current_user] || conn.assigns[:user] || conn.assigns[:actor]
    conn = Ash.PlugHelpers.set_actor(conn, actor)
    result = AshTypescript.Rpc.run_action(:ashtypea, conn, params)
    json(conn, result)
  end

  def validate(conn, params) do
    actor = conn.assigns[:current_user] || conn.assigns[:user] || conn.assigns[:actor]
    conn = Ash.PlugHelpers.set_actor(conn, actor)
    result = AshTypescript.Rpc.validate_action(:ashtypea, conn, params)
    json(conn, result)
  end
end
