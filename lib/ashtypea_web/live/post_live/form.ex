defmodule AshtypeaWeb.PostLive.Form do
  use AshtypeaWeb, :live_view
  
  on_mount {AshtypeaWeb.LiveUserAuth, :live_user_required}

  @impl true
  def mount(params, _session, socket) do
    case load_post(params["id"], socket.assigns.current_user) do
      {:ok, post} ->
        action = if is_nil(post), do: "New", else: "Edit"
        page_title = action <> " Post"

        {:ok,
        socket
        |> assign(:return_to, return_to(params["return_to"]))
        |> assign(post: post)
        |> assign(:page_title, page_title)
        |> assign(:current_scope, socket.assigns[:current_scope])
        |> assign_form()}

      {:error, _reason} ->
        {:ok,
        socket
        |> put_flash(:error, "Post not found")
        |> push_navigate(to: ~p"/posts")}
    end
  end

  defp load_post(nil, _current_user), do: {:ok, nil}

  defp load_post(id, current_user) do
    Ash.get(
      Ashtypea.Blog.Post,
      id,
      actor: current_user
    )
  end

  defp return_to("show"), do: "show"
  defp return_to(_), do: "index"

  @impl true
  def handle_event("validate", %{"post" => post_params}, socket) do
    {:noreply, assign(socket, form: AshPhoenix.Form.validate(socket.assigns.form, post_params))}
  end

  def handle_event("save", %{"post" => post_params}, socket) do
    case AshPhoenix.Form.submit(socket.assigns.form, params: post_params) do
      {:ok, post} ->
        socket =
          socket
          |> put_flash(:info, "Post #{socket.assigns.form.source.type}d successfully")
          |> push_navigate(to: return_path(socket.assigns.return_to, post))

        {:noreply, socket}

      {:error, form} ->
        {:noreply, assign(socket, form: form)}
    end
  end

  defp assign_form(%{assigns: %{post: post}} = socket) do

    current_user = socket.assigns[:current_user]

    form =
      if post do
        AshPhoenix.Form.for_update(post, :update, as: "post",  actor: current_user)
      else
        AshPhoenix.Form.for_create(Ashtypea.Blog.Post, :create, as: "post",  actor: current_user)
      end

    assign(socket, form: to_form(form))
  end

  defp return_path("index", _post), do: ~p"/posts"
  defp return_path("show", post), do: ~p"/posts/#{post.id}"
end
