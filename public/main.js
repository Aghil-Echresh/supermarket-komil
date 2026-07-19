const api = '/api/todos';
const listEl = document.getElementById('todoList');
const newTodoInput = document.getElementById('newTodo');
const addBtn = document.getElementById('addBtn');

async function fetchTodos() {
  const res = await fetch(api);
  const todos = await res.json();
  render(todos);
}

function createItemElement(todo) {
  const li = document.createElement('li');
  li.className = 'flex items-center justify-between p-2 border rounded';

  li.innerHTML = `
    <div class="flex items-center space-x-3">
      <input type="checkbox" ${todo.done ? 'checked' : ''} />
      <span class="${todo.done ? 'line-through text-gray-400' : ''}">${escapeHtml(todo.title)}</span>
    </div>
    <div class="flex items-center space-x-2">
      <button class="delete text-red-500">حذف</button>
    </div>
  `;

  const checkbox = li.querySelector('input[type=checkbox]');
  checkbox.addEventListener('change', async () => {
    await fetch(`${api}/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: checkbox.checked ? 1 : 0 })
    });
    fetchTodos();
  });

  li.querySelector('.delete').addEventListener('click', async () => {
    if (!confirm('حذف شود؟')) return;
    await fetch(`${api}/${todo.id}`, { method: 'DELETE' });
    fetchTodos();
  });

  return li;
}

function render(todos) {
  listEl.innerHTML = '';
  if (todos.length === 0) {
    listEl.innerHTML = '<li class="text-gray-500">هیچ موردی وجود ندارد.</li>';
    return;
  }
  todos.forEach(t => listEl.appendChild(createItemElement(t)));
}

addBtn.addEventListener('click', async () => {
  const v = newTodoInput.value.trim();
  if (!v) return;
  await fetch(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: v })
  });
  newTodoInput.value = '';
  fetchTodos();
});

newTodoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

function escapeHtml(str) {
  return str.replace(/[&<>\"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

fetchTodos();
