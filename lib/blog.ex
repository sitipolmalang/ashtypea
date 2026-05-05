defmodule Blog do
  use Ash.Domain,
    otp_app: :ashtypea,
    extensions: [AshTypescript.Rpc]

  typescript_rpc do
    resource Blog.Post do
      rpc_action :list_posts, :read
      rpc_action :create_post, :create
      rpc_action :update_post, :update
      rpc_action :delete_post, :destroy
    end
  end

  resources do
    resource Blog.Post
  end
end
