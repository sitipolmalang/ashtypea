defmodule Ashtypea.Blog.Post do
  use Ash.Resource, 
  otp_app: :ashtypea, 
  domain: Ashtypea.Blog, 
  authorizers: [Ash.Policy.Authorizer],
  data_layer: AshPostgres.DataLayer,
  extensions: [
    AshTypescript.Resource,
    AshFormBuilder
  ]

  postgres do
    table "posts"
    repo Ashtypea.Repo
  end

  typescript do
    type_name "Post"
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:title, :body]

      change relate_actor(:user)
    end

    update :update do
      accept [:title, :body]
    end
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

  relationships do
    belongs_to :user, Ashtypea.Accounts.User do
      allow_nil? false
      public? true
    end
  end

  forms do
    form :create do
      submit_label "Create Post"
      accent       :teal
      transitions  :smooth

      field :title do
        label       "Post Title"
        placeholder "Enter post title"
        required    true
      end

      field :body do
        label       "Post Body"
        placeholder "Enter post body"
      end
    end

    form :update do
      submit_label "Update Post"
      accent       :indigo
    end
  end

  policies do
    # admin bypass semua
    bypass actor_attribute_equals(:role, :admin) do
      authorize_if always()
    end

    # user hanya lihat post miliknya
    policy action_type(:read) do
      authorize_if expr(user_id == ^actor(:id))
    end

    # create
    policy action_type(:create) do
      authorize_if actor_present()
    end

    # update/delete hanya owner
    policy action_type([:update, :destroy]) do
      authorize_if expr(user_id == ^actor(:id))
    end
  end
end
