defmodule Blog.Post do
  use Ash.Resource, 
  otp_app: :ashtypea, 
  domain: Blog, 
  data_layer: AshPostgres.DataLayer,
  extensions: [AshTypescript.Resource]

  postgres do
    table "posts"
    repo Ashtypea.Repo
  end

  actions do
    defaults [:read, :destroy, create: [:title, :body], update: [:title, :body]]
  end

  attributes do
    uuid_primary_key :id

    attribute :title, :string do
      allow_nil? false
      public? true
    end

    attribute :body, :string do
      public? true
    end

    timestamps()
  end
  
  identities do
    identity :unique_title, [:title]
  end
end
