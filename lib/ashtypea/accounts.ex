defmodule Ashtypea.Accounts do
  use Ash.Domain, otp_app: :ashtypea, extensions: [AshAdmin.Domain]

  admin do
    show? true
  end

  resources do
    resource Ashtypea.Accounts.Token
    resource Ashtypea.Accounts.User
  end
end
