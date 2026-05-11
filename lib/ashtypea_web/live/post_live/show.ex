defmodule AshtypeaWeb.PostLive.Show do
  use AshtypeaWeb, :live_view
  on_mount {AshtypeaWeb.LiveUserAuth, :live_user_required}

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash}>
      <.header>
        Post {@post.id}
        <:subtitle>This is a post record from your database.</:subtitle>

        <:actions>
          <.button navigate={~p"/posts"}>
            <.icon name="hero-arrow-left" />
          </.button>
          <.button variant="primary" navigate={~p"/posts/#{@post}/edit?return_to=show"}>
            <.icon name="hero-pencil-square" /> Edit Post
          </.button>
        </:actions>
      </.header>

      <.list>
        <:item title="Id">{@post.id}</:item>

        <:item title="Title">{@post.title}</:item>

        <:item title="Body">{@post.body}</:item>
      </.list>
    </Layouts.app>
    """
  end

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Show Post")
     |> assign(:post, Ashtypea.Blog.get_post!(id))}
  end
end
