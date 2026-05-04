defmodule Ashtypea.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      AshtypeaWeb.Telemetry,
      Ashtypea.Repo,
      {DNSCluster, query: Application.get_env(:ashtypea, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Ashtypea.PubSub},
      # Start a worker by calling: Ashtypea.Worker.start_link(arg)
      # {Ashtypea.Worker, arg},
      # Start to serve requests, typically the last entry
      AshtypeaWeb.Endpoint,
      {AshAuthentication.Supervisor, [otp_app: :ashtypea]}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Ashtypea.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    AshtypeaWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
