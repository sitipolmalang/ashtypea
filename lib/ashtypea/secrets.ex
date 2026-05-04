defmodule Ashtypea.Secrets do
  use AshAuthentication.Secret

  def secret_for(
        [:authentication, :tokens, :signing_secret],
        Ashtypea.Accounts.User,
        _opts,
        _context
      ) do
    Application.fetch_env(:ashtypea, :token_signing_secret)
  end
end
