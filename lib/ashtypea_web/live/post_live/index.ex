defmodule AshtypeaWeb.PostLive.Index do
  use AshtypeaWeb, :live_view
  on_mount {AshtypeaWeb.LiveUserAuth, :live_user_required}
  use Cinder.UrlSync

  @collection_id "post-collection"

  # @impl true
  # def render(assigns) do
  #   ~H"""
  #   <Layouts.app flash={@flash}>
  #     <.header>
  #       Listing Posts
  #       <:actions>
  #         <.button variant="primary" navigate={~p"/posts/new"}>
  #           <.icon name="hero-plus" /> New Post
  #         </.button>
  #       </:actions>
  #     </.header>

  #     <.table
  #       id="posts"
  #       rows={@streams.posts}
  #       row_click={fn {_id, post} -> JS.navigate(~p"/posts/#{post}") end}
  #     >
  #       <:col :let={{_id, post}} label="Id">{post.id}</:col>

  #       <:col :let={{_id, post}} label="Title">{post.title}</:col>

  #       <:col :let={{_id, post}} label="Body">{post.body}</:col>

  #       <:action :let={{_id, post}}>
  #         <div class="sr-only">
  #           <.link navigate={~p"/posts/#{post}"}>Show</.link>
  #         </div>

  #         <.link navigate={~p"/posts/#{post}/edit"}>Edit</.link>
  #       </:action>

  #       <:action :let={{id, post}}>
  #         <.link
  #           phx-click={JS.push("delete", value: %{id: post.id}) |> hide("##{id}")}
  #           data-confirm="Are you sure?"
  #         >
  #           Delete
  #         </.link>
  #       </:action>
  #     </.table>
  #   </Layouts.app>
  #   """
  # end

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Listing Posts")
     |> assign(:url_state, false) # use this to enable url syncing with Cinder
     |> assign(:record, nil) # use this to hold the record being edited or shown
     |> assign(:form, nil) # use this to hold the form for the record being edited or created
     |> assign(:current_scope, socket.assigns[:current_scope])
     |> stream(:posts, Ashtypea.Blog.list_posts!())}
  end

  @impl true
  def handle_info({:form_submitted, Ashtypea.Blog.Post, _result}, socket) do
    posts = Ashtypea.Blog.list_posts!()

    {:noreply,
     socket
     |> stream(:posts, posts, reset: true)
     |> put_flash(:info, "Post saved successfully.")
     |> Cinder.refresh_table(@collection_id)
     |> push_patch(to: ~p"/posts")}
  end

  @impl true
  def handle_event("delete", %{"id" => id}, socket) do
    post = Ashtypea.Blog.get_post!(id)
    Ashtypea.Blog.delete_post!(post)

    {:noreply,
     socket
     |> put_flash(:info, "Post deleted successfully.")
     |> Cinder.refresh_table(@collection_id)}
  end

  @impl true
  def handle_event("show_post", %{"id" => id}, socket) do
    {:noreply, push_navigate(socket, to: ~p"/posts/#{id}")}
  end
end
