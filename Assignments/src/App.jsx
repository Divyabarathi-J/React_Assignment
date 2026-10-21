// import { useState } from 'react'
// import heroImg from './assets/hero.png'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <section id="center">
//         <div className="hero">
//           <img src={heroImg} className="base" width="170" height="179" alt="" />
//           <img src={reactLogo} className="framework" alt="React logo" />
//           <img src={viteLogo} className="vite" alt="Vite logo" />
//         </div>
//         <div>
//           <h1>Get started</h1>
//           <p>
//             Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
//           </p>
//         </div>
//         <button
//           type="button"
//           className="counter"
//           onClick={() => setCount((count) => count + 1)}
//         >
//           Count is {count}
//         </button>
//       </section>

//       <div className="ticks"></div>

//       <section id="next-steps">
//         <div id="docs">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#documentation-icon"></use>
//           </svg>
//           <h2>Documentation</h2>
//           <p>Your questions, answered</p>
//           <ul>
//             <li>
//               <a href="https://vite.dev/" target="_blank">
//                 <img className="logo" src={viteLogo} alt="" />
//                 Explore Vite
//               </a>
//             </li>
//             <li>
//               <a href="https://react.dev/" target="_blank">
//                 <img className="button-icon" src={reactLogo} alt="" />
//                 Learn more
//               </a>
//             </li>
//           </ul>
//         </div>
//         <div id="social">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#social-icon"></use>
//           </svg>
//           <h2>Connect with us</h2>
//           <p>Join the Vite community</p>
//           <ul>
//             <li>
//               <a href="https://github.com/vitejs/vite" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#github-icon"></use>
//                 </svg>
//                 GitHub
//               </a>
//             </li>
//             <li>
//               <a href="https://chat.vite.dev/" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#discord-icon"></use>
//                 </svg>
//                 Discord
//               </a>
//             </li>
//             <li>
//               <a href="https://x.com/vite_js" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#x-icon"></use>
//                 </svg>
//                 X.com
//               </a>
//             </li>
//             <li>
//               <a href="https://bsky.app/profile/vite.dev" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#bluesky-icon"></use>
//                 </svg>
//                 Bluesky
//               </a>
//             </li>
//           </ul>
//         </div>
//       </section>

//       <div className="ticks"></div>
//       <section id="spacer"></section>
//     </>
//   )
// }

// export default App



import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "https://dummyjson.com/recipes?limit=0";
const KEY = "recipe-book-data";
const LIMIT = 8;

const emptyForm = {
  name: "", cuisine: "", image: "", rating: "4.5",
  prepTimeMinutes: "10", cookTimeMinutes: "20", servings: "2",
  difficulty: "Easy", ingredients: "", instructions: "",
};

const toForm = (r) => ({
  ...emptyForm,
  ...r,
  rating: String(r.rating ?? 4.5),
  prepTimeMinutes: String(r.prepTimeMinutes ?? 10),
  cookTimeMinutes: String(r.cookTimeMinutes ?? 20),
  servings: String(r.servings ?? 2),
  ingredients: (r.ingredients || []).join("\n"),
  instructions: (r.instructions || []).join("\n"),
});

function App() {
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [badImages, setBadImages] = useState({});
  const [imageRetry, setImageRetry] = useState({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const saved = localStorage.getItem(KEY);

        if (saved !== null) {
          const data = JSON.parse(saved);
          if (!Array.isArray(data)) throw new Error();
          if (active) setRecipes(data);
        } else {
          const response = await fetch(API);
          if (!response.ok) throw new Error("Could not load recipes.");

          const data = await response.json();
          const list = data.recipes || [];
          localStorage.setItem(KEY, JSON.stringify(list));
          if (active) setRecipes(list);
        }

        if (active) setStatus("success");
      } catch {
        if (active) {
          setMessage("Could not load recipes. Check your connection and retry.");
          setStatus("error");
        }
      }
    }

    load();
    return () => { active = false; };
  }, [retry]);

  const save = (list) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      setRecipes(list);
      setMessage("Changes saved!");
      setStatus("success");
    } catch {
      setMessage("Unable to save. Browser storage may be full.");
    }
  };

  const cuisines = useMemo(
    () => ["All", ...new Set(recipes.map((r) => r.cuisine).filter(Boolean))],
    [recipes]
  );

  const filtered = recipes.filter((r) =>
    `${r.name} ${r.cuisine} ${(r.ingredients || []).join(" ")}`
      .toLowerCase().includes(search.toLowerCase()) &&
    (cuisine === "All" || r.cuisine === cuisine)
  );

  const pages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const visible = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const submit = (e) => {
    e.preventDefault();

    const rating = Number(form.rating);
    const prep = Number(form.prepTimeMinutes);
    const cook = Number(form.cookTimeMinutes);
    const servings = Number(form.servings);

    if (!form.name.trim() || !form.cuisine.trim() ||
        !form.ingredients.trim() || !form.instructions.trim()) {
      return setMessage("Fill in all required fields.");
    }

    if (rating < 0 || rating > 5 || !Number.isFinite(rating) ||
        !Number.isInteger(prep) || prep < 0 ||
        !Number.isInteger(cook) || cook < 0 ||
        !Number.isInteger(servings) || servings < 1) {
      return setMessage("Enter valid rating, time and serving values.");
    }

    if (form.image.trim()) {
      try {
        if (!["http:", "https:"].includes(new URL(form.image).protocol))
          throw new Error();
      } catch {
        return setMessage("Enter a valid image URL.");
      }
    }

    const data = {
      ...form,
      name: form.name.trim(),
      cuisine: form.cuisine.trim(),
      rating, prepTimeMinutes: prep, cookTimeMinutes: cook, servings,
      ingredients: form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
      instructions: form.instructions.split("\n").map((s) => s.trim()).filter(Boolean),
    };

    save(editing !== null
      ? recipes.map((r) => r.id === editing ? { ...r, ...data } : r)
      : [{ ...data, id: `custom-${Date.now()}` }, ...recipes]
    );

    setSearch("");
    setCuisine("All");
    setPage(1);
    closeForm();
  };

  const remove = (id) => {
    if (window.confirm("Delete this recipe?"))
      save(recipes.filter((r) => r.id !== id));
  };

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">YOUR PERSONAL COOKBOOK</p>
          <h1>Recipe Book</h1>
        </div>
        <button className="primary-btn" onClick={() => {
          setEditing(null); setForm(emptyForm); setMessage(""); setShowForm(true);
        }}>+ Add Recipe</button>
      </header>

      <section className="toolbar">
        <input placeholder="Search recipes or ingredients..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select value={cuisine} onChange={(e) => {
          setCuisine(e.target.value); setPage(1);
        }}>
          {cuisines.map((c) => <option key={c}>{c === "All" ? "All Cuisines" : c}</option>)}
        </select>
      </section>

      {message && <div className="message" role="status">
        {message}<button onClick={() => setMessage("")}>×</button>
      </div>}

      {status === "loading" && <p className="state-message">Loading recipes...</p>}

      {status === "error" && <section className="state-message">
        <p>{message}</p>
        <button className="primary-btn" onClick={() => {
          setMessage(""); setStatus("loading"); setRetry((n) => n + 1);
        }}>Try Again</button>
      </section>}

      {status === "success" && <>
        <div className="results">
          <span>{filtered.length} recipes found</span>
          <span>{recipes.length} saved in your cookbook</span>
        </div>

        {!visible.length ? <section className="state-message">
          <h2>No recipes found</h2><p>Try another search or add a recipe.</p>
        </section> : <section className="recipe-grid">
          {visible.map((r) => <article className="recipe-card" key={r.id}>
            <div className="image-container">
              {r.image && !badImages[r.id] ? <img
                src={imageRetry[r.id] ? `${r.image}${r.image.includes("?") ? "&" : "?"}retry=${imageRetry[r.id]}` : r.image}
                alt={r.name}
                onError={() => setBadImages((p) => ({ ...p, [r.id]: true }))}
              /> : <div className="image-placeholder">
                <span>🍽️</span><p>Image unavailable</p>
                {r.image && <button className="text-btn" onClick={() => {
                  setBadImages((p) => ({ ...p, [r.id]: false }));
                  setImageRetry((p) => ({ ...p, [r.id]: (p[r.id] || 0) + 1 }));
                }}>Retry image</button>}
              </div>}
            </div>

            <div className="card-content">
              <div className="card-heading">
                <span className="cuisine">{r.cuisine || "Other"}</span>
                <span className="rating">★ {Number(r.rating || 0).toFixed(1)}</span>
              </div>
              <h2>{r.name}</h2>
              <div className="recipe-info">
                <span>⏱ {(r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0)} min</span>
                <span>🍴 {r.servings || 1} servings</span>
                <span>{r.difficulty || "Easy"}</span>
              </div>

              <details className="recipe-details">
                <summary>View recipe</summary>
                <h3>Ingredients</h3>
                <ul>{(r.ingredients || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                <h3>Instructions</h3>
                <ol>{(r.instructions || []).map((x, i) => <li key={i}>{x}</li>)}</ol>
              </details>

              <div className="card-actions">
                <button className="edit-btn" onClick={() => {
                  setEditing(r.id); setForm(toForm(r)); setMessage(""); setShowForm(true);
                }}>Edit</button>
                <button className="delete-btn" onClick={() => remove(r.id)}>Delete</button>
              </div>
            </div>
          </article>)}
        </section>}

        {filtered.length > LIMIT && <nav className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>}
      </>}

      {showForm && <div className="modal-overlay">
        <section className="recipe-form-modal">
          <div className="form-header">
            <div><p className="eyebrow">YOUR COOKBOOK</p>
              <h2>{editing !== null ? "Edit Recipe" : "Add Recipe"}</h2></div>
            <button className="close-btn" type="button" onClick={closeForm}>×</button>
          </div>

          <form onSubmit={submit}>
            <label>Recipe Name *
              <input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>Cuisine *
              <input name="cuisine" value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} required />
            </label>
            <label>Image URL
              <input name="image" type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </label>

            <div className="form-row">
              <label>Rating
                <input name="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} required />
              </label>
              <label>Difficulty
                <select name="difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              {["prepTimeMinutes", "cookTimeMinutes", "servings"].map((name) =>
                <label key={name}>{name === "servings" ? "Servings" : name === "prepTimeMinutes" ? "Prep Time (min)" : "Cook Time (min)"}
                  <input name={name} type="number" min={name === "servings" ? 1 : 0} value={form[name]}
                    onChange={(e) => setForm({ ...form, [name]: e.target.value })} required />
                </label>
              )}
            </div>

            <label>Ingredients * (one per line)
              <textarea name="ingredients" rows="4" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} required />
            </label>
            <label>Instructions * (one step per line)
              <textarea name="instructions" rows="5" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} required />
            </label>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={closeForm}>Cancel</button>
              <button type="submit" className="primary-btn">{editing !== null ? "Save Changes" : "Add Recipe"}</button>
            </div>
          </form>
        </section>
      </div>}
    </main>
  );
}

export default App;
