// Paste a Formspree form URL (https://formspree.io/f/xxxx) here to start collecting emails.
const SIGNUP_ENDPOINT = "";

const meals = [
  ["Tacos", 20, "Crispy bean tacos", "Crunchy, colourful. Zero committee meetings.", "tacos"],
  ["Pasta", 20, "Creamy tomato pasta", "Carbs have never asked you a difficult question.", "pasta"],
  ["Buddha bowl", 15, "Green goddess bowl", "Main character energy. Minimal dishes.", "bowl"],
  ["Stir-fry", 15, "Whatever’s-in stir-fry", "Your fridge called. It wants a second chance.", "noodles"],
  ["Curry", 30, "Coconut chickpea curry", "A warm hug, but make it edible.", "curry"],
  ["Pizza", 15, "Cheat’s margherita pizza", "Technically cooking. Emotionally takeaway.", "pizza"],
  ["Salmon", 25, "Lemon salmon & greens", "For your “I’ve got my life together” era.", "salmon"],
  ["Eggs", 10, "Breakfast-for-dinner eggs", "Breakfast has no jurisdiction after 6 pm.", "eggs"],
  ["Chicken", 35, "One-pan lemon chicken", "One pan. One person doing the dishes. Suspicious.", "chicken"],
  ["Fried rice", 15, "Golden egg fried rice", "Leftovers, with a glow-up.", "rice"],
  ["Wraps", 15, "Halloumi sunshine wraps", "A little golden. A little salty. Relatable.", "wrap"],
  ["Soup", 25, "Cosy tomato soup", "A duvet in a bowl.", "soup"],
];
const colors = ["var(--peach)", "var(--cream)", "var(--green)", "var(--pink)", "var(--yellow)", "var(--cream)"];

const wheel = document.getElementById("wheel");
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs, text) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text) node.textContent = text;
  return node;
};
const slice = 360 / meals.length;
wheel.append(el("circle", { cx: 220, cy: 220, r: 215, fill: "var(--paper)", stroke: "var(--ink)", "stroke-width": 2 }));
meals.forEach(([short, time], i) => {
  const a = ((i * slice - 90) * Math.PI) / 180, b = (((i + 1) * slice - 90) * Math.PI) / 180;
  const g = el("g", {});
  g.append(el("path", {
    d: `M220 220 L${220 + 210 * Math.cos(a)} ${220 + 210 * Math.sin(a)} A210 210 0 0 1 ${220 + 210 * Math.cos(b)} ${220 + 210 * Math.sin(b)} Z`,
    fill: colors[i % colors.length], stroke: "var(--ink)", "stroke-width": 1.1,
  }));
  const label = el("g", { transform: `rotate(${(i + 0.5) * slice} 220 220)` });
  label.append(el("text", { x: 220, y: 52, "text-anchor": "middle", fill: "var(--ink)", "font-size": 13, "font-weight": 600 }, short));
  label.append(el("text", { x: 220, y: 72, "text-anchor": "middle", fill: "var(--ink)", "font-size": 11 }, `${time} min`));
  g.append(label);
  wheel.append(g);
});

const spinBtn = document.getElementById("spin-btn");
const result = document.getElementById("spin-result");
let rotation = 0, last = -1;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
spinBtn.addEventListener("click", () => {
  let pick;
  do pick = crypto.getRandomValues(new Uint32Array(1))[0] % meals.length; while (pick === last);
  last = pick;
  const target = 360 - (pick + 0.5) * slice;
  const current = ((rotation % 360) + 360) % 360;
  rotation += 360 * 5 + ((target - current + 360) % 360);
  spinBtn.disabled = true;
  result.hidden = true;
  wheel.style.transform = `rotate(${rotation}deg)`;
  setTimeout(() => {
    const [, , name, note, photo] = meals[pick];
    document.getElementById("result-name").textContent = name + ".";
    document.getElementById("result-note").textContent = note;
    const img = document.getElementById("result-photo");
    img.src = `food/${photo}.jpg`;
    img.alt = name;
    result.hidden = false;
    spinBtn.disabled = false;
    spinBtn.firstChild.textContent = "Spin again ";
  }, reduceMotion ? 50 : 3450);
});

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
document.querySelectorAll("[data-signup]").forEach((form) => {
  const input = form.querySelector('input[type="email"]');
  const note = form.querySelector(".signup-note");
  const button = form.querySelector("button");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = input.value.trim();
    note.classList.remove("error");
    if (form.querySelector(".hp").value) return;
    if (!emailOk(email)) {
      input.setAttribute("aria-invalid", "true");
      note.classList.add("error");
      note.textContent = "That email looks a bit undercooked. Try again?";
      input.focus();
      return;
    }
    input.removeAttribute("aria-invalid");
    if (!SIGNUP_ENDPOINT) {
      note.classList.add("error");
      note.textContent = "Sign-ups open very soon. Please check back shortly.";
      return;
    }
    button.disabled = true;
    button.textContent = "Saving…";
    try {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, source: "dinner-banter-coming-soon" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.classList.add("done");
      note.textContent = "You’re on the list. We’ll save you a seat at the table.";
    } catch {
      note.classList.add("error");
      note.textContent = "Our oven’s playing up. Please try again in a minute.";
      button.disabled = false;
      button.textContent = "Save my seat";
    }
  });
});
