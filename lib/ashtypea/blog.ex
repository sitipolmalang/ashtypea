defmodule Ashtypea.Blog do
  use Ash.Domain,
    otp_app: :ashtypea,
    extensions: [AshTypescript.Rpc]

  typescript_rpc do
    resource Ashtypea.Blog.Post do
      rpc_action :list_posts, :read
      rpc_action :create_post, :create
      rpc_action :update_post, :update
      rpc_action :delete_post, :destroy
    end
  end

  resources do
    resource Ashtypea.Blog.Post do
      define :create_post, action: :create
      define :list_posts, action: :read
      define :update_post, action: :update
      define :delete_post, action: :destroy
      define :get_post, action: :read, get_by: :id
    end
  end
end
