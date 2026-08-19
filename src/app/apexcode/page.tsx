"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings,
  Code,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Eye,
  Files,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  PenLine,
  ChevronRight,
  GitBranch,
  X,
  AlertCircle,
} from "lucide-react";
import ApexCodeSearchBar from "@/components/ApexCodeSearchBar";
import CodeSyntaxLine from "@/components/CodeSyntaxLine";
import { THINKING_MESSAGES } from "@/lib/thinking-messages";

/* â”€â”€â”€ types â”€â”€â”€ */
type GeneratedFile = { path: string; content: string };

type PromptMessage = {
  id: string;
  text: string;
};

type GenerationRecord = {
  id: string;
  prompt: string;
  files: GeneratedFile[];
  activeFile: string | null;
  createdAt: number;
  answer?: string | null;
};

type TreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
};

/* â”€â”€â”€ constants â”€â”€â”€ */
const APP_BUILD_SYSTEM_PROMPT = `You are a senior full-stack developer working inside a professional IDE. Build a complete, production-quality web application based on the user's prompt.

CRITICAL OUTPUT FORMAT:
- Respond with ONLY a single valid JSON object. No markdown, no code fences, no commentary before or after — nothing else.
- The JSON shape is exactly:
{
  "files": {
    "index.html": "complete self-contained HTML page with inline <style> and <script>",
    "src/App.js": "main application logic",
    "README.md": "short project overview"
  }
}

CRITICAL CONTENT RULES:
- "index.html" is REQUIRED and must be a complete, self-contained, RUNNING HTML page with inline <style> and <script> and zero external dependencies.
- Generate REAL, specific content and data: realistic product names, prices, user names, posts, tasks, messages, and copy that fit the prompt. Never use placeholders like "TODO", "Lorem ipsum", "example.com", "Your Name" or "Enter your name".
- The app MUST be fully functional: working buttons, forms, tabs, modals, lists, filters and interactions. Not a static mockup.
- Use a polished, modern design (gradients, shadows, responsive layout, strong typography, smooth micro-interactions). Dark theme unless the prompt says otherwise.
- Escape all quotes and special characters in every file value so the entire response is valid JSON.`;

const APP_BUILD_RETRY_PROMPT = `The previous attempt was rejected because it was not a single valid JSON object and no files were created.

Respond again with ONLY a single valid JSON object — no markdown fences, no commentary, nothing before or after the JSON. The shape is exactly:
{"files":{"index.html":"...","src/App.js":"...","README.md":"..."}}

index.html must be a complete, self-contained, RUNNING HTML app with inline CSS and JS, with real functional content matching the user's prompt (no placeholder text, no lorem ipsum, fully working interactions). Escape all quotes so the response is valid JSON.`;

const buildCodePreview = (prompt: string) => `// Generated Application Component
import React from 'react';

export default function AppWorkspace() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">App Workspace</h1>
      <p className="text-slate-400 mt-2">${prompt}</p>
    </div>
  );
}`;

const buildReadme = (promptText: string) => `# ${promptText}

A complete, self-contained web application built by ApexCode.

## What's inside
- index.html — the full working app (HTML + CSS + JS in one file)
- src/App.js — main application component
- README.md — this overview

## Features
- Real, working interactions — no placeholders
- Responsive, modern UI
- Zero external dependencies — runs anywhere`;

const FALLBACK_STYLE = `  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 8px; }`;

function fallbackTodoApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TaskFlow — Task Manager</title>
<style>
${FALLBACK_STYLE}
  .wrap { max-width: 680px; margin: 0 auto; padding: 40px 16px; }
  header { text-align: center; margin-bottom: 28px; }
  header h1 { font-size: 30px; background: linear-gradient(90deg,#818cf8,#22d3ee); -webkit-background-clip: text; background-clip: text; color: transparent; }
  header p { color: #94a3b8; margin-top: 6px; font-size: 14px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 20px; }
  .input-row { display: flex; gap: 10px; margin-bottom: 16px; }
  .input-row input { flex: 1; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 14px; outline: none; }
  .input-row input:focus { border-color: #818cf8; }
  .input-row button { background: linear-gradient(90deg,#6366f1,#0ea5e9); border: none; color: #fff; font-weight: 600; border-radius: 10px; padding: 0 20px; cursor: pointer; font-size: 14px; }
  .input-row button:hover { opacity: 0.9; }
  .filters { display: flex; gap: 8px; margin-bottom: 16px; }
  .filters button { background: #0f172a; border: 1px solid #334155; color: #94a3b8; border-radius: 999px; padding: 6px 14px; font-size: 12px; cursor: pointer; font-weight: 600; }
  .filters button.active { background: #6366f1; border-color: #6366f1; color: #fff; }
  .progress { height: 6px; background: #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
  .progress div { height: 100%; background: linear-gradient(90deg,#6366f1,#22d3ee); border-radius: 6px; transition: width .3s; }
  .stats { display: flex; justify-content: space-between; color: #94a3b8; font-size: 12px; margin-bottom: 12px; }
  ul { list-style: none; }
  li { display: flex; align-items: center; gap: 12px; background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; animation: pop .25s ease; }
  @keyframes pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  li.done span { text-decoration: line-through; color: #64748b; }
  li input[type="checkbox"] { width: 18px; height: 18px; accent-color: #6366f1; cursor: pointer; }
  li span { flex: 1; font-size: 14px; }
  li .tag { font-size: 10px; background: #334155; color: #94a3b8; border-radius: 6px; padding: 3px 8px; text-transform: uppercase; letter-spacing: .05em; }
  li button { background: none; border: none; color: #64748b; font-size: 16px; cursor: pointer; padding: 4px; }
  li button:hover { color: #f87171; }
  .empty { text-align: center; color: #64748b; padding: 30px 0; font-size: 13px; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>&#10003; TaskFlow</h1>
    <p>Plan your day, track your goals, get things done.</p>
  </header>
  <div class="card">
    <div class="input-row">
      <input id="taskInput" placeholder="Add a new task e.g. Finish project report..." />
      <button onclick="addTask()">Add Task</button>
    </div>
    <div class="filters">
      <button class="active" data-f="all" onclick="setFilter('all', this)">All</button>
      <button data-f="active" onclick="setFilter('active', this)">Active</button>
      <button data-f="done" onclick="setFilter('done', this)">Done</button>
    </div>
    <div class="progress"><div id="progressBar" style="width:0%"></div></div>
    <div class="stats"><span id="leftCount">0 tasks left</span><span id="totalCount">0 total</span></div>
    <ul id="taskList"></ul>
    <div class="empty" id="emptyMsg">No tasks yet. Add your first task above!</div>
  </div>
</div>
<script>
  var tasks = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
  var currentFilter = 'all';
  function save() { localStorage.setItem('taskflow_tasks', JSON.stringify(tasks)); render(); }
  function addTask() {
    var inp = document.getElementById('taskInput');
    var text = inp.value.trim();
    if (!text) return;
    tasks.unshift({ id: Date.now(), text: text, done: false });
    inp.value = '';
    save();
  }
  function toggleTask(id, checked) {
    var t = tasks.find(function(x) { return x.id === id; });
    if (t) { t.done = checked; save(); }
  }
  function removeTask(id) { tasks = tasks.filter(function(x) { return x.id !== id; }); save(); }
  function setFilter(f, btn) {
    currentFilter = f;
    document.querySelectorAll('.filters button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    render();
  }
  function render() {
    var list = document.getElementById('taskList');
    var shown = tasks.filter(function(t) {
      if (currentFilter === 'done') return t.done;
      if (currentFilter === 'active') return !t.done;
      return true;
    });
    list.innerHTML = shown.map(function(t) {
      return '<li class="' + (t.done ? 'done' : '') + '">' +
        '<input type="checkbox" ' + (t.done ? 'checked' : '') + ' onchange="toggleTask(' + t.id + ', this.checked)" />' +
        '<span>' + escapeHtml(t.text) + '</span>' +
        '<span class="tag">' + (t.done ? 'done' : 'todo') + '</span>' +
        '<button title="Delete task" onclick="removeTask(' + t.id + ')">&#10005;</button></li>';
    }).join('');
    var done = tasks.filter(function(t) { return t.done; }).length;
    document.getElementById('progressBar').style.width = tasks.length ? Math.round(done / tasks.length * 100) + '%' : '0%';
    document.getElementById('leftCount').textContent = (tasks.length - done) + ' tasks left';
    document.getElementById('totalCount').textContent = tasks.length + ' total';
    document.getElementById('emptyMsg').style.display = shown.length ? 'none' : 'block';
  }
  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
  document.getElementById('taskInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') addTask(); });
  render();
</script>
</body>
</html>`;
}

function fallbackLandingApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Aurora — Modern SaaS Platform</title>
<style>
${FALLBACK_STYLE}
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(15,23,42,.85); backdrop-filter: blur(12px); border-bottom: 1px solid #1e293b; }
  .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; }
  .brand { font-weight: 800; font-size: 18px; letter-spacing: .02em; }
  .brand span { color: #818cf8; }
  .links { display: flex; gap: 24px; }
  .links a { color: #94a3b8; text-decoration: none; font-size: 13px; font-weight: 500; }
  .links a:hover { color: #e2e8f0; }
  .cta { background: linear-gradient(90deg,#6366f1,#0ea5e9); color: #fff; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .burger { display: none; background: none; border: none; color: #e2e8f0; font-size: 22px; cursor: pointer; }
  .mobile-menu { display: none; flex-direction: column; gap: 14px; padding: 16px 20px; background: #0f172a; border-bottom: 1px solid #1e293b; }
  .mobile-menu.open { display: flex; }
  .mobile-menu a { color: #94a3b8; text-decoration: none; font-size: 14px; }
  .hero { max-width: 1100px; margin: 0 auto; padding: 130px 20px 60px; text-align: center; }
  .hero .pill { display: inline-block; background: rgba(99,102,241,.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,.3); border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
  .hero h1 { font-size: 44px; line-height: 1.15; margin-bottom: 18px; }
  .hero h1 .grad { background: linear-gradient(90deg,#818cf8,#22d3ee,#34d399); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .hero p { color: #94a3b8; font-size: 16px; max-width: 560px; margin: 0 auto 28px; }
  .hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .btn-secondary { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 10px; padding: 12px 22px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-secondary:hover { border-color: #6366f1; }
  .features { max-width: 1100px; margin: 0 auto; padding: 60px 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
  .feature { background: #1e293b; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; transition: transform .2s, border-color .2s; }
  .feature:hover { transform: translateY(-4px); border-color: #6366f1; }
  .feature .icon { font-size: 24px; margin-bottom: 12px; }
  .feature h3 { font-size: 16px; margin-bottom: 8px; }
  .feature p { color: #94a3b8; font-size: 13px; line-height: 1.6; }
  .section-title { text-align: center; font-size: 28px; margin-bottom: 40px; }
  .pricing { max-width: 900px; margin: 0 auto; padding: 0 20px 70px; }
  .toggle { display: flex; justify-content: center; gap: 10px; margin-bottom: 30px; align-items: center; color: #94a3b8; font-size: 13px; }
  .toggle button { background: #1e293b; border: 1px solid #334155; color: #94a3b8; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 12px; font-weight: 600; }
  .toggle button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
  .plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
  .plan { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 26px; text-align: center; }
  .plan.hot { border-color: #6366f1; box-shadow: 0 0 30px rgba(99,102,241,.15); }
  .plan h3 { font-size: 15px; margin-bottom: 10px; }
  .plan .price { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
  .plan .price small { font-size: 13px; color: #94a3b8; font-weight: 400; }
  .plan ul { list-style: none; margin: 16px 0 20px; text-align: left; }
  .plan li { color: #94a3b8; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #1e293b; }
  .plan li:last-child { border: none; }
  .plan button { width: 100%; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 10px; padding: 11px; font-weight: 600; font-size: 13px; cursor: pointer; }
  .plan.hot button { background: linear-gradient(90deg,#6366f1,#0ea5e9); border: none; color: #fff; }
  .faq { max-width: 700px; margin: 0 auto; padding: 0 20px 80px; }
  .faq-item { background: #1e293b; border: 1px solid #1e293b; border-radius: 12px; margin-bottom: 10px; overflow: hidden; }
  .faq-q { width: 100%; background: none; border: none; color: #e2e8f0; font-size: 14px; font-weight: 600; padding: 16px 18px; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
  .faq-q .arrow { transition: transform .2s; color: #6366f1; }
  .faq-item.open .arrow { transform: rotate(45deg); }
  .faq-a { display: none; color: #94a3b8; font-size: 13px; line-height: 1.7; padding: 0 18px 16px; }
  .faq-item.open .faq-a { display: block; }
  footer { border-top: 1px solid #1e293b; padding: 26px 20px; text-align: center; color: #475569; font-size: 12px; }
  @media (max-width: 720px) { .links { display: none; } .burger { display: block; } .hero h1 { font-size: 32px; } }
</style>
</head>
<body>
<nav class="nav"><div class="nav-inner">
  <div class="brand">Aurora<span>.</span></div>
  <div class="links">
    <a href="#features">Features</a>
    <a href="#pricing">Pricing</a>
    <a href="#faq">FAQ</a>
  </div>
  <button class="cta">Get Started Free</button>
  <button class="burger" onclick="toggleMenu()">&#9776;</button>
</div></nav>
<div class="mobile-menu" id="mobileMenu">
  <a href="#features">Features</a>
  <a href="#pricing">Pricing</a>
  <a href="#faq">FAQ</a>
  <button class="cta" style="width:100%">Get Started Free</button>
</div>
<section class="hero">
  <span class="pill">&#9889; New — AI Workflows v2.1</span>
  <h1>Ship your product <span class="grad">faster</span> with Aurora</h1>
  <p>Aurora is the all-in-one platform for modern teams — analytics, automation and collaboration in one beautiful workspace.</p>
  <div class="hero-btns">
    <button class="cta" onclick="scrollTo('features')">Start Free Trial</button>
    <button class="btn-secondary" onclick="scrollTo('pricing')">View Pricing</button>
  </div>
</section>
<section id="features" class="features">
  <div style="grid-column:1/-1" class="section-title">Everything your team needs</div>
  <div class="feature"><div class="icon">&#128202;</div><h3>Real-time Analytics</h3><p>Track 40+ metrics with live dashboards, custom reports and scheduled email digests.</p></div>
  <div class="feature"><div class="icon">&#128276;</div><h3>Smart Automations</h3><p>Build trigger-based workflows that replace 10 hours of manual work every week.</p></div>
  <div class="feature"><div class="icon">&#128101;</div><h3>Team Collaboration</h3><p>Shared boards, comments and approvals keep every project moving in lockstep.</p></div>
  <div class="feature"><div class="icon">&#128274;</div><h3>Enterprise Security</h3><p>SOC 2 Type II, SSO/SAML and granular role-based access control out of the box.</p></div>
</section>
<section id="pricing" class="pricing">
  <div class="section-title">Simple, transparent pricing</div>
  <div class="toggle"><span>Monthly</span><button id="toggleBtn" onclick="toggleBilling(this)">Yearly &#8212;20%</button><span>Yearly</span></div>
  <div class="plans">
    <div class="plan"><h3>Starter</h3><div class="price"><span class="amount">$19</span><small>/month</small></div><ul><li>3 team members</li><li>10 GB storage</li><li>Basic analytics</li><li>Email support</li></ul><button>Choose Starter</button></div>
    <div class="plan hot"><h3>Pro</h3><div class="price"><span class="amount">$49</span><small>/month</small></div><ul><li>15 team members</li><li>100 GB storage</li><li>Advanced analytics</li><li>Automations + API</li></ul><button>Choose Pro</button></div>
    <div class="plan"><h3>Business</h3><div class="price"><span class="amount">$99</span><small>/month</small></div><ul><li>Unlimited members</li><li>1 TB storage</li><li>SSO / SAML</li><li>Priority support</li></ul><button>Choose Business</button></div>
  </div>
</section>
<section id="faq" class="faq">
  <div class="section-title">Frequently asked questions</div>
  <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">How does the free trial work? <span class="arrow">+</span></button><div class="faq-a">Every plan starts with a 14-day free trial — no credit card required. You keep full access to every feature until the trial ends.</div></div>
  <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">Can I change plans later? <span class="arrow">+</span></button><div class="faq-a">Yes. You can upgrade or downgrade at any time. Charges are prorated automatically to the day.</div></div>
  <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">Is my data secure? <span class="arrow">+</span></button><div class="faq-a">Absolutely. Aurora is SOC 2 Type II certified, encrypts data at rest and in transit, and never sells your information.</div></div>
</section>
<footer>&#169; 2026 Aurora Labs, Inc. All rights reserved.</footer>
<script>
  function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
  function scrollTo(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
  var yearly = false;
  function toggleBilling(btn) {
    yearly = !yearly;
    btn.classList.toggle('active', yearly);
    btn.textContent = yearly ? 'Monthly' : 'Yearly \u201420%';
    var prices = document.querySelectorAll('.plan .amount');
    prices[0].textContent = yearly ? '$15' : '$19';
    prices[1].textContent = yearly ? '$39' : '$49';
    prices[2].textContent = yearly ? '$79' : '$99';
  }
  function toggleFaq(btn) { btn.parentElement.classList.toggle('open'); }
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) { e.preventDefault(); scrollTo(a.getAttribute('href').slice(1)); document.getElementById('mobileMenu').classList.remove('open'); });
  });
</script>
</body>
</html>`;
}

function fallbackShopApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>NovaStore — Modern Shopping</title>
<style>
${FALLBACK_STYLE}
  body { padding-bottom: 90px; }
  .header { position: sticky; top: 0; z-index: 40; background: rgba(15,23,42,.9); backdrop-filter: blur(10px); border-bottom: 1px solid #1e293b; }
  .header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; }
  .brand { font-weight: 800; font-size: 18px; }
  .brand span { color: #22d3ee; }
  .cart-btn { position: relative; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 10px; padding: 9px 14px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .cart-btn .count { position: absolute; top: -6px; right: -6px; background: #22d3ee; color: #0f172a; border-radius: 999px; font-size: 10px; font-weight: 800; padding: 2px 6px; }
  .hero { max-width: 1100px; margin: 0 auto; padding: 50px 20px 30px; text-align: center; }
  .hero h1 { font-size: 34px; margin-bottom: 8px; }
  .hero p { color: #94a3b8; font-size: 14px; }
  .grid { max-width: 1100px; margin: 0 auto; padding: 10px 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 18px; }
  .product { background: #1e293b; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; transition: transform .2s, border-color .2s; }
  .product:hover { transform: translateY(-4px); border-color: #22d3ee; }
  .thumb { height: 150px; display: flex; align-items: center; justify-content: center; font-size: 44px; background: linear-gradient(135deg,#0f172a,#1e293b); }
  .meta { padding: 14px; }
  .meta h3 { font-size: 14px; margin-bottom: 6px; }
  .meta .row { display: flex; align-items: center; justify-content: space-between; }
  .price { color: #22d3ee; font-weight: 700; font-size: 15px; }
  .old-price { color: #64748b; text-decoration: line-through; font-size: 12px; margin-left: 6px; }
  .meta button { background: linear-gradient(90deg,#0891b2,#22d3ee); border: none; color: #fff; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
  .meta button:hover { opacity: .9; }
  .cart { position: fixed; top: 0; right: -380px; width: 340px; max-width: 90vw; height: 100vh; background: #0f172a; border-left: 1px solid #1e293b; transition: right .3s ease; z-index: 60; display: flex; flex-direction: column; }
  .cart.open { right: 0; }
  .cart-head { display: flex; align-items: center; justify-content: space-between; padding: 18px; border-bottom: 1px solid #1e293b; font-weight: 700; }
  .cart-head button { background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; }
  .cart-items { flex: 1; overflow-y: auto; padding: 14px; }
  .cart-item { display: flex; align-items: center; gap: 12px; background: #1e293b; border-radius: 10px; padding: 10px; margin-bottom: 10px; }
  .cart-item .thumb { width: 46px; height: 46px; font-size: 22px; border-radius: 8px; }
  .cart-item .info { flex: 1; }
  .cart-item .info h4 { font-size: 12px; margin-bottom: 4px; }
  .cart-item .qty { display: flex; align-items: center; gap: 8px; font-size: 12px; }
  .cart-item .qty button { background: #334155; border: none; color: #e2e8f0; width: 22px; height: 22px; border-radius: 6px; cursor: pointer; }
  .cart-item .rm { background: none; border: none; color: #64748b; cursor: pointer; font-size: 14px; }
  .cart-foot { border-top: 1px solid #1e293b; padding: 16px; }
  .cart-foot .total { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 12px; }
  .checkout { width: 100%; background: linear-gradient(90deg,#0891b2,#22d3ee); border: none; color: #fff; border-radius: 10px; padding: 12px; font-weight: 700; cursor: pointer; }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 55; display: none; }
  .overlay.show { display: block; }
  .empty-cart { text-align: center; color: #64748b; padding: 40px 0; font-size: 13px; }
  .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(80px); background: #10b981; color: #fff; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 600; transition: transform .3s; z-index: 70; }
  .toast.show { transform: translateX(-50%) translateY(0); }
</style>
</head>
<body>
<header class="header"><div class="header-inner">
  <div class="brand">Nova<span>Store</span></div>
  <button class="cart-btn" onclick="openCart()">&#128722; Cart <span class="count" id="cartCount">0</span></button>
</div></header>
<section class="hero">
  <h1>New Season. Fresh Picks.</h1>
  <p>Hand-picked tech essentials, shipping worldwide within 48 hours.</p>
</section>
<div class="grid" id="grid"></div>
<div class="overlay" id="overlay" onclick="closeCart()"></div>
<aside class="cart" id="cart">
  <div class="cart-head"><span>Shopping Cart</span><button onclick="closeCart()">&#10005;</button></div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-foot">
    <div class="total"><span>Total</span><span id="cartTotal">&#8377;0</span></div>
    <button class="checkout" onclick="checkout()">Proceed to Checkout</button>
  </div>
</aside>
<div class="toast" id="toast"></div>
<script>
  var products = [
    { id: 1, name: 'Aurora Wireless Headphones', price: 2499, old: 3999, icon: '&#127911;' },
    { id: 2, name: 'Pulse Smart Watch Series 5', price: 5499, old: 7499, icon: '&#8982;' },
    { id: 3, name: 'Nova Mechanical Keyboard', price: 3899, old: 4999, icon: '&#9000;' },
    { id: 4, name: 'Zen 4K Action Camera', price: 8999, old: 11999, icon: '&#128248;' },
    { id: 5, name: 'Echo Portable Speaker', price: 1999, old: 2999, icon: '&#128266;' },
    { id: 6, name: 'Stream Pro Webcam 1080p', price: 2799, old: 3499, icon: '&#128249;' },
    { id: 7, name: 'Lumen RGB Desk Lamp', price: 1499, old: 1999, icon: '&#128161;' },
    { id: 8, name: 'Drift USB-C Hub 7-in-1', price: 1299, old: 1799, icon: '&#128421;' }
  ];
  var cart = JSON.parse(localStorage.getItem('novastore_cart') || '{}');
  function render() {
    var grid = document.getElementById('grid');
    grid.innerHTML = products.map(function(p) {
      return '<div class="product"><div class="thumb">' + p.icon + '</div><div class="meta"><h3>' + p.name + '</h3><div class="row"><span class="price">&#8377;' + p.price.toLocaleString('en-IN') + '<span class="old-price">&#8377;' + p.old.toLocaleString('en-IN') + '</span></span><button onclick="addToCart(' + p.id + ')">Add</button></div></div></div>';
    }).join('');
    updateCart();
  }
  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    localStorage.setItem('novastore_cart', JSON.stringify(cart));
    updateCart();
    toast('&#128077; Added to cart');
  }
  function changeQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    localStorage.setItem('novastore_cart', JSON.stringify(cart));
    updateCart();
  }
  function removeItem(id) { delete cart[id]; localStorage.setItem('novastore_cart', JSON.stringify(cart)); updateCart(); }
  function updateCart() {
    var count = 0, total = 0;
    Object.keys(cart).forEach(function(id) {
      var p = products.find(function(x) { return x.id == id; });
      if (!p) return;
      count += cart[id];
      total += cart[id] * p.price;
    });
    document.getElementById('cartCount').textContent = count;
    var box = document.getElementById('cartItems');
    var keys = Object.keys(cart);
    if (!keys.length) { box.innerHTML = '<div class="empty-cart">Your cart is empty.<br/>Add something you love!</div>'; }
    else {
      box.innerHTML = keys.map(function(id) {
        var p = products.find(function(x) { return x.id == id; });
        if (!p) return '';
        return '<div class="cart-item"><div class="thumb">' + p.icon + '</div><div class="info"><h4>' + p.name + '</h4><div class="qty"><button onclick="changeQty(' + id + ',-1)">&#8722;</button><span>' + cart[id] + '</span><button onclick="changeQty(' + id + ',1)">+</button></div></div><span class="price">&#8377;' + (cart[id] * p.price).toLocaleString('en-IN') + '</span><button class="rm" onclick="removeItem(' + id + ')">&#10005;</button></div>';
      }).join('');
    }
    document.getElementById('cartTotal').textContent = '&#8377;' + total.toLocaleString('en-IN');
  }
  function openCart() { document.getElementById('cart').classList.add('open'); document.getElementById('overlay').classList.add('show'); }
  function closeCart() { document.getElementById('cart').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }
  function checkout() {
    if (!Object.keys(cart).length) { toast('&#9888;&#65039; Cart is empty'); return; }
    var total = document.getElementById('cartTotal').textContent;
    toast('&#9989; Order placed! Total ' + total + '. Thank you!');
    cart = {}; localStorage.setItem('novastore_cart', '{}'); updateCart();
  }
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { t.classList.remove('show'); }, 2200);
  }
  render();
</script>
</body>
</html>`;
}

function fallbackDashboardApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PulseBoard — Analytics Dashboard</title>
<style>
${FALLBACK_STYLE}
  .app { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; background: #111827; border-right: 1px solid #1f2937; padding: 20px 14px; display: flex; flex-direction: column; gap: 6px; }
  .sidebar .brand { font-weight: 800; font-size: 16px; padding: 6px 12px 18px; }
  .sidebar .brand span { color: #34d399; }
  .sidebar button { background: none; border: none; color: #64748b; text-align: left; padding: 10px 12px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; }
  .sidebar button:hover { background: #1f2937; color: #e2e8f0; }
  .sidebar button.active { background: rgba(52,211,153,.12); color: #34d399; }
  .main { flex: 1; padding: 26px; min-width: 0; }
  .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
  .top h1 { font-size: 22px; }
  .top .date { color: #64748b; font-size: 13px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat { background: #1e293b; border: 1px solid #1f2937; border-radius: 14px; padding: 18px; }
  .stat .label { color: #94a3b8; font-size: 12px; margin-bottom: 8px; }
  .stat .value { font-size: 26px; font-weight: 800; }
  .stat .delta { font-size: 12px; margin-top: 6px; }
  .up { color: #34d399; } .down { color: #f87171; }
  .panel { background: #1e293b; border: 1px solid #1f2937; border-radius: 14px; padding: 18px; margin-bottom: 20px; }
  .panel h2 { font-size: 15px; margin-bottom: 14px; }
  .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .panel-head select, .panel-head button { background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 8px; padding: 7px 12px; font-size: 12px; cursor: pointer; }
  canvas { width: 100% !important; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { color: #64748b; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; padding: 8px 10px; border-bottom: 1px solid #334155; }
  td { padding: 10px; border-bottom: 1px solid #1f2937; }
  tr:hover td { background: rgba(255,255,255,.02); }
  .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 600; }
  .badge.paid { background: rgba(52,211,153,.12); color: #34d399; }
  .badge.pending { background: rgba(251,191,36,.12); color: #fbbf24; }
  .badge.failed { background: rgba(248,113,113,.12); color: #f87171; }
  .hidden { display: none; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 900px) { .sidebar { width: 64px; padding: 16px 8px; } .sidebar .brand, .sidebar button { font-size: 0; } .sidebar button::after { content: '\\2022'; } .grid-2 { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="brand">Pulse<span>Board</span></div>
    <button class="active" data-view="overview" onclick="switchView('overview', this)">&#128200; Overview</button>
    <button data-view="orders" onclick="switchView('orders', this)">&#128722; Orders</button>
    <button data-view="customers" onclick="switchView('customers', this)">&#128101; Customers</button>
    <button data-view="reports" onclick="switchView('reports', this)">&#128196; Reports</button>
  </aside>
  <div class="main">
    <div class="top">
      <h1>Good morning, Rahul</h1>
      <span class="date" id="clock">--</span>
    </div>
    <div class="stats">
      <div class="stat"><div class="label">Total Revenue</div><div class="value">&#8377;12,48,500</div><div class="delta up">&#9650; 12.4% vs last month</div></div>
      <div class="stat"><div class="label">Active Orders</div><div class="value">342</div><div class="delta up">&#9650; 8.1% vs last month</div></div>
      <div class="stat"><div class="label">New Customers</div><div class="value">1,286</div><div class="delta up">&#9650; 21.7% vs last month</div></div>
      <div class="stat"><div class="label">Refunds</div><div class="value">&#8377;18,240</div><div class="delta down">&#9660; 3.2% vs last month</div></div>
    </div>
    <div class="grid-2">
      <div class="panel" style="grid-column: 1 / -1;">
        <div class="panel-head"><h2>Revenue Trend</h2><select id="range" onchange="drawChart()"><option>Last 7 days</option><option selected>Last 30 days</option><option>Last 12 months</option></select></div>
        <canvas id="chart" height="220"></canvas>
      </div>
    </div>
    <div class="panel" id="ordersView">
      <div class="panel-head"><h2>Recent Orders</h2><button onclick="alert('Exporting orders.csv ...')">&#128229; Export CSV</button></div>
      <table>
        <tr><th>Order</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th></tr>
        <tr><td>#1042</td><td>Priya Sharma</td><td>Pro Plan (Annual)</td><td>&#8377;58,800</td><td><span class="badge paid">Paid</span></td><td>Aug 10, 2026</td></tr>
        <tr><td>#1041</td><td>Arjun Patel</td><td>Starter Plan</td><td>&#8377;2,280</td><td><span class="badge paid">Paid</span></td><td>Aug 10, 2026</td></tr>
        <tr><td>#1040</td><td>Neha Verma</td><td>Team Add-ons x5</td><td>&#8377;6,000</td><td><span class="badge pending">Pending</span></td><td>Aug 9, 2026</td></tr>
        <tr><td>#1039</td><td>Vikram Singh</td><td>Enterprise Package</td><td>&#8377;2,40,000</td><td><span class="badge paid">Paid</span></td><td>Aug 9, 2026</td></tr>
        <tr><td>#1038</td><td>Kavya Nair</td><td>Pro Plan (Monthly)</td><td>&#8377;5,880</td><td><span class="badge failed">Failed</span></td><td>Aug 8, 2026</td></tr>
        <tr><td>#1037</td><td>Rohit Kulkarni</td><td>Storage Add-on</td><td>&#8377;1,200</td><td><span class="badge paid">Paid</span></td><td>Aug 8, 2026</td></tr>
      </table>
    </div>
    <div class="panel hidden" id="customersView">
      <div class="panel-head"><h2>Top Customers</h2></div>
      <table>
        <tr><th>Customer</th><th>Plan</th><th>Lifetime Value</th><th>Last Active</th></tr>
        <tr><td>Vikram Singh</td><td>Enterprise</td><td>&#8377;9,60,000</td><td>Today</td></tr>
        <tr><td>Priya Sharma</td><td>Pro Annual</td><td>&#8377;3,52,800</td><td>Today</td></tr>
        <tr><td>Neha Verma</td><td>Team</td><td>&#8377;1,86,000</td><td>2 days ago</td></tr>
        <tr><td>Arjun Patel</td><td>Starter</td><td>&#8377;45,600</td><td>3 days ago</td></tr>
      </table>
    </div>
    <div class="panel hidden" id="reportsView">
      <div class="panel-head"><h2>Monthly Report — July 2026</h2><button onclick="alert('Report emailed to your inbox.')">&#128231; Email Report</button></div>
      <p style="color:#94a3b8; font-size:13px; line-height:1.8;">Revenue grew <b style="color:#34d399">12.4%</b> month-over-month to &#8377;12,48,500. Customer acquisition cost dropped <b style="color:#34d399">6.8%</b> while retention held steady at <b style="color:#34d399">94.2%</b>. The highest-performing channel was organic search, contributing <b style="color:#34d399">38%</b> of new signups. Recommended focus: reduce refund rate (currently 3.2%) by tightening the onboarding flow.</p>
    </div>
  </div>
</div>
<script>
  function switchView(name, btn) {
    document.querySelectorAll('.sidebar button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var views = ['orders', 'customers', 'reports'];
    views.forEach(function(v) { document.getElementById(v + 'View').classList.toggle('hidden', v !== name); });
  }
  function clock() {
    var d = new Date();
    var opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('clock').textContent = d.toLocaleDateString('en-IN', opts);
  }
  setInterval(clock, 30000); clock();
  function drawChart() {
    var c = document.getElementById('chart');
    var ctx = c.getContext('2d');
    var W = c.width = c.clientWidth * 2;
    var H = c.height = 220 * 2;
    var data = [42, 58, 51, 74, 66, 89, 82, 96, 78, 110, 104, 128];
    var labels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    var max = Math.max.apply(null, data);
    ctx.clearRect(0, 0, W, H);
    var padL = 40, padB = 34, padT = 16;
    var cw = (W - padL - 16) / data.length;
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(52,211,153,.35)');
    grad.addColorStop(1, 'rgba(52,211,153,0)');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i <= 4; i++) {
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.beginPath();
      var y = padT + (H - padT - padB) * i / 4;
      ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '20px sans-serif';
      ctx.fillText('₹' + Math.round(max * (1 - i / 4) / 10) + '0k', 4, y + 6);
    }
    ctx.beginPath();
    data.forEach(function(v, i) {
      var x = padL + cw * i + cw / 2;
      var y = padT + (H - padT - padB) * (1 - v / max);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#34d399'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.stroke();
    data.forEach(function(v, i) {
      var x = padL + cw * i + cw / 2;
      var y = padT + (H - padT - padB) * (1 - v / max);
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#34d399'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#64748b'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(labels[i], x, H - 12);
    });
  }
  window.addEventListener('resize', drawChart);
  drawChart();
</script>
</body>
</html>`;
}

function fallbackCalculatorApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Calc Pro — Calculator</title>
<style>
${FALLBACK_STYLE}
  body { display: flex; align-items: center; justify-content: center; padding: 24px; }
  .calc { width: 320px; background: #1e293b; border: 1px solid #334155; border-radius: 22px; padding: 20px; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
  .display { background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 18px; text-align: right; margin-bottom: 16px; }
  .expr { color: #64748b; font-size: 13px; min-height: 18px; overflow: hidden; white-space: nowrap; }
  .result { font-size: 34px; font-weight: 700; overflow: hidden; white-space: nowrap; }
  .keys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  button { background: #0f172a; border: 1px solid #1f2937; color: #e2e8f0; border-radius: 12px; padding: 16px 0; font-size: 17px; font-weight: 600; cursor: pointer; transition: background .15s, transform .05s; }
  button:hover { background: #334155; }
  button:active { transform: scale(.95); }
  .op { color: #38bdf8; }
  .eq { background: linear-gradient(135deg,#0ea5e9,#6366f1); border: none; color: #fff; }
  .eq:hover { background: linear-gradient(135deg,#0284c7,#4f46e5); }
  .clear { color: #f87171; }
</style>
</head>
<body>
<div class="calc">
  <div class="display">
    <div class="expr" id="expr">&nbsp;</div>
    <div class="result" id="result">0</div>
  </div>
  <div class="keys">
    <button class="clear" onclick="clearAll()">AC</button>
    <button class="op" onclick="press('(')">(</button>
    <button class="op" onclick="press(')')">)</button>
    <button class="op" onclick="press('&#247;')">&#247;</button>
    <button onclick="press('7')">7</button>
    <button onclick="press('8')">8</button>
    <button onclick="press('9')">9</button>
    <button class="op" onclick="press('*')">&#215;</button>
    <button onclick="press('4')">4</button>
    <button onclick="press('5')">5</button>
    <button onclick="press('6')">6</button>
    <button class="op" onclick="press('-')">&#8722;</button>
    <button onclick="press('1')">1</button>
    <button onclick="press('2')">2</button>
    <button onclick="press('3')">3</button>
    <button class="op" onclick="press('+')">+</button>
    <button onclick="press('0')">0</button>
    <button onclick="press('.')">.</button>
    <button onclick="backspace()">&#9003;</button>
    <button class="eq" onclick="calculate()">=</button>
  </div>
</div>
<script>
  var expr = '', last = '';
  function press(c) {
    expr += c === '\u00d7' ? '*' : c === '\u00f7' ? '/' : c === '\u2212' ? '-' : c;
    render();
  }
  function backspace() { expr = expr.slice(0, -1); render(); }
  function clearAll() { expr = ''; last = ''; render(); }
  function render() {
    document.getElementById('expr').innerHTML = expr.replace(/\*/g, '&#215;').replace(/\//g, '&#247;') || '&nbsp;';
    document.getElementById('result').textContent = expr || '0';
  }
  function calculate() {
    try {
      if (!expr) return;
      var result = Function('"use strict"; return (' + expr + ')')();
      if (typeof result === 'number' && !isFinite(result)) throw new Error('Infinity');
      document.getElementById('expr').textContent = expr + ' =';
      document.getElementById('result').textContent = Math.round(result * 1e10) / 1e10;
      expr = String(Math.round(result * 1e10) / 1e10);
    } catch (e) {
      document.getElementById('expr').textContent = expr;
      document.getElementById('result').textContent = 'Error';
      expr = '';
    }
  }
  document.addEventListener('keydown', function(e) {
    var k = e.key;
    if (/[0-9.+\-*/()]/.test(k)) { press(k); }
    else if (k === 'Enter' || k === '=') { e.preventDefault(); calculate(); }
    else if (k === 'Backspace') { backspace(); }
    else if (k === 'Escape') { clearAll(); }
  });
</script>
</body>
</html>`;
}

function fallbackQuizApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Quizly — Trivia Challenge</title>
<style>
${FALLBACK_STYLE}
  body { display: flex; align-items: center; justify-content: center; padding: 24px; }
  .quiz { width: 480px; max-width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 26px; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
  .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .top-bar .brand { font-weight: 800; }
  .top-bar .brand span { color: #fbbf24; }
  .score-pill { background: #0f172a; border: 1px solid #334155; border-radius: 999px; padding: 5px 12px; font-size: 12px; font-weight: 700; }
  .progress { height: 8px; background: #0f172a; border-radius: 8px; overflow: hidden; margin-bottom: 22px; }
  .progress div { height: 100%; background: linear-gradient(90deg,#fbbf24,#f59e0b); border-radius: 8px; transition: width .3s; }
  .question { font-size: 17px; font-weight: 600; line-height: 1.5; margin-bottom: 20px; min-height: 52px; }
  .options { display: flex; flex-direction: column; gap: 10px; }
  .option { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 13px 16px; font-size: 14px; cursor: pointer; transition: all .15s; text-align: left; color: #e2e8f0; }
  .option:hover { border-color: #fbbf24; }
  .option.correct { background: rgba(52,211,153,.15); border-color: #34d399; color: #34d399; font-weight: 700; }
  .option.wrong { background: rgba(248,113,113,.15); border-color: #f87171; color: #f87171; }
  .option:disabled { cursor: not-allowed; }
  .next-row { margin-top: 18px; display: flex; justify-content: flex-end; }
  .next { background: linear-gradient(90deg,#f59e0b,#fbbf24); border: none; color: #0f172a; font-weight: 800; border-radius: 10px; padding: 11px 22px; font-size: 13px; cursor: pointer; }
  .next:disabled { opacity: .4; cursor: not-allowed; }
  .end { text-align: center; padding: 30px 0; }
  .end .emoji { font-size: 52px; margin-bottom: 14px; }
  .end h2 { font-size: 22px; margin-bottom: 8px; }
  .end p { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
  .end .again { background: linear-gradient(90deg,#f59e0b,#fbbf24); border: none; color: #0f172a; border-radius: 10px; padding: 12px 26px; font-weight: 800; font-size: 14px; cursor: pointer; }
</style>
</head>
<body>
<div class="quiz">
  <div class="top-bar">
    <div class="brand">Quiz<span>ly</span></div>
    <span class="score-pill" id="scorePill">Score: 0</span>
  </div>
  <div class="progress"><div id="bar" style="width:0%"></div></div>
  <div id="body"></div>
</div>
<script>
  var questions = [
    { q: 'Which data structure uses FIFO order?', opts: ['Stack', 'Queue', 'Tree', 'Graph'], a: 1 },
    { q: 'What does HTML stand for?', opts: ['HyperText Markup Language', 'HighText Machine Language', 'Hyperlink Text Markup Language', 'Home Tool Markup Language'], a: 0 },
    { q: 'Which company developed React?', opts: ['Google', 'Microsoft', 'Meta (Facebook)', 'Amazon'], a: 2 },
    { q: 'What is the time complexity of binary search?', opts: ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'], a: 2 },
    { q: 'Which protocol secures web traffic?', opts: ['FTP', 'HTTPS', 'SMTP', 'HTTP/0.9'], a: 1 }
  ];
  var index = 0, score = 0, answered = false;
  function render() {
    if (index >= questions.length) return showEnd();
    var q = questions[index];
    document.getElementById('bar').style.width = (index / questions.length * 100) + '%';
    document.getElementById('scorePill').textContent = 'Score: ' + score;
    var opts = q.opts.map(function(o, i) {
      return '<button class="option" data-i="' + i + '" onclick="pick(' + i + ')">' + (i + 1) + '. ' + o + '</button>';
    }).join('');
    document.getElementById('body').innerHTML =
      '<div class="question">Q' + (index + 1) + '. ' + q.q + '</div>' +
      '<div class="options">' + opts + '</div>' +
      '<div class="next-row"><button class="next" id="nextBtn" disabled onclick="nextQ()">Next &#8594;</button></div>';
  }
  function pick(i) {
    if (answered) return;
    answered = true;
    var q = questions[index];
    var btns = document.querySelectorAll('.option');
    btns.forEach(function(b) { b.disabled = true; });
    btns[q.a].classList.add('correct');
    if (i === q.a) { score++; }
    else { btns[i].classList.add('wrong'); }
    document.getElementById('scorePill').textContent = 'Score: ' + score;
    document.getElementById('nextBtn').disabled = false;
  }
  function nextQ() { index++; answered = false; render(); }
  function showEnd() {
    var pct = Math.round(score / questions.length * 100);
    var emoji = pct >= 80 ? '&#127942;' : pct >= 50 ? '&#128170;' : '&#127793;';
    var msg = pct >= 80 ? 'Outstanding! You are a trivia master.' : pct >= 50 ? 'Good effort — keep practicing!' : 'Don\u2019t give up, try again!';
    document.getElementById('bar').style.width = '100%';
    document.getElementById('body').innerHTML =
      '<div class="end"><div class="emoji">' + emoji + '</div><h2>' + score + ' / ' + questions.length + ' correct</h2><p>' + msg + '</p><button class="again" onclick="restart()">Play Again</button></div>';
  }
  function restart() { index = 0; score = 0; answered = false; render(); }
  render();
</script>
</body>
</html>`;
}

function fallbackWeatherApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SkyCast — Weather App</title>
<style>
${FALLBACK_STYLE}
  body { background: linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%); padding: 32px 16px; }
  .wrap { max-width: 640px; margin: 0 auto; }
  .search { display: flex; gap: 10px; margin-bottom: 24px; }
  .search input { flex: 1; background: rgba(255,255,255,.06); border: 1px solid #334155; color: #e2e8f0; border-radius: 14px; padding: 13px 16px; font-size: 14px; outline: none; }
  .search input:focus { border-color: #38bdf8; }
  .search button { background: linear-gradient(90deg,#0284c7,#38bdf8); border: none; color: #fff; border-radius: 14px; padding: 0 20px; font-weight: 700; font-size: 14px; cursor: pointer; }
  .hero-card { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 22px; padding: 28px; text-align: center; backdrop-filter: blur(10px); margin-bottom: 20px; }
  .city { font-size: 18px; color: #94a3b8; }
  .temp { font-size: 64px; font-weight: 800; line-height: 1.1; }
  .cond { color: #94a3b8; font-size: 14px; margin: 6px 0 14px; }
  .unit-toggle { background: #0f172a; border: 1px solid #334155; border-radius: 10px; overflow: hidden; display: inline-flex; }
  .unit-toggle button { background: none; border: none; color: #94a3b8; padding: 8px 16px; cursor: pointer; font-weight: 700; font-size: 13px; }
  .unit-toggle button.active { background: #38bdf8; color: #0f172a; }
  .meta { display: flex; justify-content: center; gap: 26px; margin-top: 16px; color: #94a3b8; font-size: 13px; }
  .forecast { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .day { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 14px 6px; text-align: center; }
  .day .d { font-size: 11px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .05em; }
  .day .icon { font-size: 22px; margin-bottom: 6px; }
  .day .t { font-size: 13px; font-weight: 700; }
  .day .t span { color: #64748b; font-weight: 400; }
  .cities { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 20px; }
  .cities button { background: rgba(255,255,255,.05); border: 1px solid #334155; color: #94a3b8; border-radius: 999px; padding: 6px 14px; font-size: 12px; cursor: pointer; }
  .cities button:hover { color: #e2e8f0; border-color: #38bdf8; }
  @media (max-width: 560px) { .forecast { grid-template-columns: repeat(5, minmax(56px, 1fr)); overflow-x: auto; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="search">
    <input id="cityInput" placeholder="Search city e.g. Mumbai, Delhi, London..." />
    <button onclick="searchCity()">Search</button>
  </div>
  <div class="hero-card">
    <div class="city" id="cityName">Mumbai, Maharashtra</div>
    <div class="temp" id="temp">32&#176;</div>
    <div class="cond" id="cond">Partly Cloudy</div>
    <div class="unit-toggle">
      <button id="cBtn" class="active" onclick="setUnit('c')">&#176;C</button>
      <button id="fBtn" onclick="setUnit('f')">&#176;F</button>
    </div>
    <div class="meta" id="meta">
      <span>&#128167; Humidity: 74%</span>
      <span>&#128200; Wind: 18 km/h</span>
      <span>&#127777; Feels like 34&#176;</span>
    </div>
  </div>
  <div class="forecast" id="forecast"></div>
  <div class="cities">
    <button onclick="selectCity('mumbai')">Mumbai</button>
    <button onclick="selectCity('delhi')">Delhi</button>
    <button onclick="selectCity('bangalore')">Bangalore</button>
    <button onclick="selectCity('london')">London</button>
    <button onclick="selectCity('newyork')">New York</button>
    <button onclick="selectCity('tokyo')">Tokyo</button>
  </div>
</div>
<script>
  var data = {
    mumbai: { city: 'Mumbai, Maharashtra', c: 32, cond: 'Partly Cloudy', hum: 74, wind: 18, feels: 34, days: [['Mon','&#9925;',31,27],['Tue','&#127780;',30,26],['Wed','&#127777;',33,28],['Thu','&#9928;',31,26],['Fri','&#9729;',29,25]] },
    delhi: { city: 'Delhi, NCT', c: 36, cond: 'Sunny', hum: 41, wind: 12, feels: 39, days: [['Mon','&#9728;',36,27],['Tue','&#9728;',37,28],['Wed','&#9729;',34,26],['Thu','&#9925;',33,26],['Fri','&#9728;',35,27]] },
    bangalore: { city: 'Bengaluru, Karnataka', c: 27, cond: 'Light Rain', hum: 82, wind: 14, feels: 29, days: [['Mon','&#127783;',27,21],['Tue','&#127783;',26,21],['Wed','&#9925;',28,22],['Thu','&#127783;',27,21],['Fri','&#9928;',29,22]] },
    london: { city: 'London, UK', c: 18, cond: 'Overcast', hum: 68, wind: 22, feels: 17, days: [['Mon','&#9729;',18,12],['Tue','&#127783;',16,11],['Wed','&#9729;',17,11],['Thu','&#9925;',19,13],['Fri','&#9728;',21,14]] },
    newyork: { city: 'New York, USA', c: 26, cond: 'Clear', hum: 55, wind: 15, feels: 27, days: [['Mon','&#9728;',26,18],['Tue','&#9728;',27,19],['Wed','&#9925;',25,17],['Thu','&#9729;',23,16],['Fri','&#9728;',26,18]] },
    tokyo: { city: 'Tokyo, Japan', c: 29, cond: 'Humid', hum: 71, wind: 10, feels: 33, days: [['Mon','&#9925;',29,24],['Tue','&#127780;',30,25],['Wed','&#127783;',28,23],['Thu','&#9925;',29,24],['Fri','&#9728;',31,25]] }
  };
  var unit = 'c', current = 'mumbai';
  function render() {
    var d = data[current];
    var show = function(v) { return unit === 'c' ? v : Math.round(v * 9 / 5 + 32); };
    var u = unit === 'c' ? '\u00b0' : '\u00b0';
    document.getElementById('cityName').textContent = d.city;
    document.getElementById('temp').textContent = show(d.c) + u + (unit === 'c' ? 'C' : 'F');
    document.getElementById('cond').textContent = d.cond;
    document.getElementById('meta').innerHTML = '<span>&#128167; Humidity: ' + d.hum + '%</span><span>&#128200; Wind: ' + d.wind + ' km/h</span><span>&#127777; Feels like ' + show(d.feels) + '\u00b0</span>';
    document.getElementById('forecast').innerHTML = d.days.map(function(x) {
      return '<div class="day"><div class="d">' + x[0] + '</div><div class="icon">' + x[1] + '</div><div class="t">' + show(x[2]) + '\u00b0 <span>' + show(x[3]) + '\u00b0</span></div></div>';
    }).join('');
    document.getElementById('cBtn').classList.toggle('active', unit === 'c');
    document.getElementById('fBtn').classList.toggle('active', unit === 'f');
  }
  function setUnit(u) { unit = u; render(); }
  function selectCity(c) { current = c; document.getElementById('cityInput').value = ''; render(); }
  function searchCity() {
    var q = document.getElementById('cityInput').value.trim().toLowerCase().replace(/[^a-z]/g, '');
    var keys = Object.keys(data);
    var hit = keys.find(function(k) { return k === q || data[k].city.toLowerCase().indexOf(q) > -1; });
    if (hit) { selectCity(hit); }
    else {
      var hero = document.querySelector('.hero-card');
      hero.innerHTML = '<div style="padding:30px"><h2>&#128554;</h2><p style="color:#94a3b8; font-size:14px;">No forecast found for that city.<br/>Try Mumbai, Delhi, Bangalore, London, New York or Tokyo.</p></div>';
    }
  }
  document.getElementById('cityInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') searchCity(); });
  render();
</script>
</body>
</html>`;
}

function fallbackChatApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Chatter — Messenger</title>
<style>
${FALLBACK_STYLE}
  body { display: flex; align-items: center; justify-content: center; padding: 20px; }
  .chat { width: 420px; max-width: 100%; height: 620px; max-height: 90vh; background: #1e293b; border: 1px solid #334155; border-radius: 22px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
  .head { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid #1f2937; background: #111827; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#22d3ee); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; color: #fff; }
  .head .name { font-weight: 700; font-size: 14px; }
  .head .status { font-size: 11px; color: #34d399; }
  .msgs { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
  .msg { max-width: 75%; padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.5; animation: pop .2s ease; }
  @keyframes pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .msg.them { background: #0f172a; border: 1px solid #1f2937; align-self: flex-start; border-bottom-left-radius: 4px; }
  .msg.me { background: linear-gradient(135deg,#4f46e5,#0ea5e9); color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
  .msg .time { display: block; font-size: 10px; opacity: .6; margin-top: 4px; text-align: right; }
  .typing { align-self: flex-start; background: #0f172a; border: 1px solid #1f2937; border-radius: 16px; border-bottom-left-radius: 4px; padding: 12px 16px; display: none; }
  .typing span { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; display: inline-block; margin-right: 3px; animation: bounce 1s infinite; }
  .typing span:nth-child(2) { animation-delay: .15s; }
  .typing span:nth-child(3) { animation-delay: .3s; }
  @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
  .input-row { display: flex; gap: 10px; padding: 14px; border-top: 1px solid #1f2937; background: #111827; }
  .input-row input { flex: 1; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 999px; padding: 12px 16px; font-size: 13px; outline: none; }
  .input-row input:focus { border-color: #6366f1; }
  .input-row button { background: linear-gradient(135deg,#6366f1,#22d3ee); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-size: 17px; flex-shrink: 0; }
  .date { align-self: center; font-size: 10px; color: #64748b; background: #0f172a; border: 1px solid #1f2937; border-radius: 999px; padding: 4px 12px; }
</style>
</head>
<body>
<div class="chat">
  <div class="head">
    <div class="avatar">AR</div>
    <div>
      <div class="name">Aarav &amp; Team</div>
      <div class="status">&#9679; Online</div>
    </div>
  </div>
  <div class="msgs" id="msgs"></div>
  <div class="typing" id="typing"><span></span><span></span><span></span></div>
  <div class="input-row">
    <input id="input" placeholder="Type a message..." />
    <button onclick="send()">&#10148;</button>
  </div>
</div>
<script>
  var replies = [
    'Sounds good! I\u2019ll finalise the design by EOD.',
    'Can we move the review call to 4 PM instead?',
    'Yes, the new dashboard looks clean. Ship it!',
    'Let me check the analytics and get back to you.',
    'Perfect, thanks for the update!',
    'I\u2019ve added the requirements to the board.',
    'On it. Will share a preview link shortly.'
  ];
  var seeded = [
    ['them', 'Hey team! Quick sync on the launch plan today.', '09:41'],
    ['me', 'Sure, I\u2019ve prepared the updated timeline.', '09:42'],
    ['them', 'Great, sharing the client feedback in a bit.', '09:44']
  ];
  function now() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
  function addMsg(from, text) {
    var box = document.getElementById('msgs');
    var div = document.createElement('div');
    div.className = 'msg ' + from;
    div.innerHTML = '<span>' + text.replace(/</g, '&lt;') + '</span><span class="time">' + now() + '</span>';
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }
  function send() {
    var inp = document.getElementById('input');
    var text = inp.value.trim();
    if (!text) return;
    addMsg('me', text);
    inp.value = '';
    showTyping();
    setTimeout(function() {
      hideTyping();
      addMsg('them', replies[Math.floor(Math.random() * replies.length)]);
    }, 1300 + Math.random() * 800);
  }
  function showTyping() { document.getElementById('typing').style.display = 'inline-flex'; document.getElementById('msgs').scrollTop = 99999; }
  function hideTyping() { document.getElementById('typing').style.display = 'none'; }
  seeded.forEach(function(m) { addMsg(m[0], m[1]); });
  document.getElementById('input').addEventListener('keydown', function(e) { if (e.key === 'Enter') send(); });
</script>
</body>
</html>`;
}

function fallbackNotesApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>NoteVault — Notes App</title>
<style>
${FALLBACK_STYLE}
  body { padding: 28px 16px; }
  .wrap { max-width: 820px; margin: 0 auto; }
  header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  h1 { font-size: 26px; }
  h1 span { color: #a78bfa; }
  .controls { display: flex; gap: 10px; align-items: center; }
  .controls input { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 10px; padding: 10px 14px; font-size: 13px; outline: none; width: 200px; }
  .controls input:focus { border-color: #a78bfa; }
  .composer { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 16px; margin-bottom: 22px; }
  .composer input, .composer textarea { width: 100%; background: #0f172a; border: 1px solid #1f2937; color: #e2e8f0; border-radius: 10px; padding: 11px 13px; font-size: 13px; outline: none; margin-bottom: 10px; font-family: inherit; }
  .composer textarea { min-height: 72px; resize: vertical; }
  .composer .row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
  .tags { display: flex; gap: 6px; }
  .tags button { background: #0f172a; border: 1px solid #334155; color: #94a3b8; border-radius: 999px; padding: 5px 12px; font-size: 11px; cursor: pointer; }
  .tags button.active { background: #a78bfa; border-color: #a78bfa; color: #0f172a; font-weight: 700; }
  .add-btn { background: linear-gradient(90deg,#8b5cf6,#a78bfa); border: none; color: #fff; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
  .note { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 16px; border-left: 4px solid #8b5cf6; animation: pop .25s ease; }
  @keyframes pop { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .note h3 { font-size: 14px; margin-bottom: 6px; }
  .note p { color: #94a3b8; font-size: 12.5px; line-height: 1.6; margin-bottom: 10px; }
  .note .foot { display: flex; justify-content: space-between; align-items: center; }
  .note .pill { font-size: 10px; background: rgba(139,92,246,.15); color: #a78bfa; border-radius: 6px; padding: 3px 8px; text-transform: uppercase; letter-spacing: .05em; font-weight: 700; }
  .note button { background: none; border: none; color: #64748b; cursor: pointer; font-size: 14px; }
  .note button:hover { color: #f87171; }
  .empty { text-align: center; color: #64748b; padding: 50px 0; font-size: 13px; }
  .count { color: #64748b; font-size: 12px; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Note<span>Vault</span></h1>
    <div class="controls">
      <input id="search" placeholder="&#128269; Search notes..." />
      <span class="count" id="count"></span>
    </div>
  </header>
  <div class="composer">
    <input id="title" placeholder="Note title e.g. Sprint planning" />
    <textarea id="body" placeholder="Write your note here..."></textarea>
    <div class="row">
      <div class="tags">
        <button class="active" data-tag="work" onclick="pickTag('work', this)">Work</button>
        <button data-tag="personal" onclick="pickTag('personal', this)">Personal</button>
        <button data-tag="ideas" onclick="pickTag('ideas', this)">Ideas</button>
      </div>
      <button class="add-btn" onclick="addNote()">+ Add Note</button>
    </div>
  </div>
  <div class="grid" id="grid"></div>
</div>
<script>
  var notes = JSON.parse(localStorage.getItem('notevault_notes') || '[]');
  if (!notes.length) {
    notes = [
      { id: 1, title: 'Launch checklist', body: 'Final review of landing page, mobile QA, payment gateway test transaction, analytics events, SEO meta tags.', tag: 'work', date: 'Aug 10' },
      { id: 2, title: 'Gym routine', body: 'Monday: chest + triceps. Wednesday: back + biceps. Friday: legs + core. Cardio 20 min daily.', tag: 'personal', date: 'Aug 09' },
      { id: 3, title: 'App ideas', body: '1) Habit tracker with streaks. 2) Split-bill calculator. 3) Local event finder. 4) Recipe planner with grocery sync.', tag: 'ideas', date: 'Aug 08' }
    ];
    save();
  }
  var selectedTag = 'work';
  function save() { localStorage.setItem('notevault_notes', JSON.stringify(notes)); render(); }
  function pickTag(t, btn) {
    selectedTag = t;
    document.querySelectorAll('.tags button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  }
  function addNote() {
    var t = document.getElementById('title').value.trim();
    var b = document.getElementById('body').value.trim();
    if (!t && !b) return;
    notes.unshift({ id: Date.now(), title: t || 'Untitled note', body: b || '—', tag: selectedTag, date: 'Aug ' + new Date().getDate() });
    document.getElementById('title').value = '';
    document.getElementById('body').value = '';
    save();
  }
  function del(id) { notes = notes.filter(function(n) { return n.id !== id; }); save(); }
  function render() {
    var q = document.getElementById('search').value.toLowerCase();
    var list = notes.filter(function(n) { return !q || (n.title + n.body).toLowerCase().indexOf(q) > -1; });
    var grid = document.getElementById('grid');
    if (!list.length) { grid.innerHTML = '<div class="empty" style="grid-column:1/-1">' + (notes.length ? 'No notes match your search.' : 'No notes yet — add your first one above!') + '</div>'; }
    else {
      grid.innerHTML = list.map(function(n) {
        return '<div class="note"><h3>' + n.title + '</h3><p>' + n.body.replace(/</g, '&lt;').replace(/\n/g, '<br/>') + '</p><div class="foot"><span class="pill">' + n.tag + '</span><span><small style="color:#475569; margin-right:10px;">' + n.date + '</small><button onclick="del(' + n.id + ')">&#128465;</button></span></div></div>';
      }).join('');
    }
    document.getElementById('count').textContent = list.length + ' note' + (list.length === 1 ? '' : 's');
  }
  document.getElementById('search').addEventListener('input', render);
  render();
</script>
</body>
</html>`;
}

function fallbackPortfolioApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Aarav Mehta — Product Designer</title>
<style>
${FALLBACK_STYLE}
  body { background: #0b0b14; }
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(11,11,20,.85); backdrop-filter: blur(12px); border-bottom: 1px solid #1e1e2e; }
  .nav-inner { max-width: 1000px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; }
  .brand { font-weight: 800; font-size: 17px; }
  .brand em { font-style: normal; color: #8b5cf6; }
  .links { display: flex; gap: 22px; }
  .links a { color: #94a3b8; text-decoration: none; font-size: 13px; }
  .links a:hover { color: #fff; }
  .burger { display: none; background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; }
  .mmenu { display: none; flex-direction: column; gap: 12px; padding: 14px 20px; background: #0b0b14; border-bottom: 1px solid #1e1e2e; }
  .mmenu.open { display: flex; }
  .mmenu a { color: #94a3b8; text-decoration: none; font-size: 14px; }
  .hero { max-width: 1000px; margin: 0 auto; padding: 130px 20px 60px; }
  .hello { color: #8b5cf6; font-weight: 700; font-size: 13px; margin-bottom: 10px; }
  .hero h1 { font-size: 40px; line-height: 1.12; margin-bottom: 14px; }
  .hero p { color: #94a3b8; max-width: 520px; font-size: 15px; line-height: 1.7; margin-bottom: 26px; }
  .btn { display: inline-block; background: linear-gradient(90deg,#8b5cf6,#6366f1); color: #fff; border-radius: 10px; padding: 12px 22px; font-size: 13px; font-weight: 700; text-decoration: none; margin-right: 10px; }
  .btn.ghost { background: #1e1e2e; color: #e2e8f0; border: 1px solid #2d2d3f; }
  .section { max-width: 1000px; margin: 0 auto; padding: 50px 20px; }
  .section h2 { font-size: 22px; margin-bottom: 8px; }
  .section .sub { color: #64748b; font-size: 13px; margin-bottom: 26px; }
  .chips { display: flex; flex-wrap: wrap; gap: 10px; }
  .chip { background: #1e1e2e; border: 1px solid #2d2d3f; color: #cbd5e1; border-radius: 999px; padding: 8px 16px; font-size: 12.5px; }
  .projects { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
  .card { background: #14141f; border: 1px solid #1e1e2e; border-radius: 16px; overflow: hidden; transition: transform .2s, border-color .2s; }
  .card:hover { transform: translateY(-4px); border-color: #8b5cf6; }
  .card .cover { height: 140px; display: flex; align-items: center; justify-content: center; font-size: 40px; }
  .card .body { padding: 18px; }
  .card h3 { font-size: 15px; margin-bottom: 6px; }
  .card p { color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 12px; }
  .card .tag { font-size: 10.5px; color: #8b5cf6; background: rgba(139,92,246,.12); border-radius: 6px; padding: 3px 8px; margin-right: 6px; }
  .timeline { border-left: 2px solid #2d2d3f; padding-left: 22px; }
  .titem { margin-bottom: 24px; position: relative; }
  .titem::before { content: ''; position: absolute; left: -29px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: #8b5cf6; box-shadow: 0 0 12px rgba(139,92,246,.6); }
  .titem h3 { font-size: 15px; }
  .titem .co { color: #64748b; font-size: 12px; margin: 3px 0 6px; }
  .titem p { color: #94a3b8; font-size: 13px; line-height: 1.6; }
  .contact { text-align: center; padding-bottom: 80px; }
  .contact h2 { margin-bottom: 14px; }
  .contact form { max-width: 420px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
  .contact input, .contact textarea { background: #14141f; border: 1px solid #2d2d3f; color: #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 13px; outline: none; font-family: inherit; }
  .contact input:focus, .contact textarea:focus { border-color: #8b5cf6; }
  .contact .err { color: #f87171; font-size: 12px; min-height: 16px; text-align: left; }
  .contact .ok { color: #34d399; font-size: 13px; margin-top: 8px; font-weight: 600; }
  footer { text-align: center; color: #475569; font-size: 12px; padding: 20px; border-top: 1px solid #1e1e2e; }
  @media (max-width: 700px) { .links { display: none; } .burger { display: block; } .hero h1 { font-size: 30px; } }
</style>
</head>
<body>
<nav class="nav"><div class="nav-inner">
  <div class="brand">Aarav<em>.</em>dev</div>
  <div class="links"><a href="#work">Work</a><a href="#exp">Experience</a><a href="#contact">Contact</a></div>
  <button class="burger" onclick="document.getElementById('mm').classList.toggle('open')">&#9776;</button>
</div></nav>
<div class="mmenu" id="mm">
  <a href="#work" onclick="closeMenu()">Work</a>
  <a href="#exp" onclick="closeMenu()">Experience</a>
  <a href="#contact" onclick="closeMenu()">Contact</a>
</div>
<section class="hero">
  <div class="hello">&#128075; Hi, I&rsquo;m Aarav Mehta</div>
  <h1>Product designer crafting <br/>delightful digital experiences</h1>
  <p>I help early-stage startups and design teams turn fuzzy ideas into intuitive, pixel-perfect products. 6+ years across fintech, health and developer tools.</p>
  <a class="btn" href="#contact">Let&rsquo;s talk</a>
  <a class="btn ghost" href="#work">See my work</a>
</section>
<section id="work" class="section">
  <h2>Selected work</h2>
  <div class="sub">Three projects I&rsquo;m most proud of, with real shipped impact.</div>
  <div class="projects">
    <div class="card"><div class="cover" style="background:linear-gradient(135deg,#1e1b4b,#312e81)">&#128176;</div><div class="body"><h3>Finly — Expense Tracking</h3><p>Redesigned onboarding for a fintech app; activation jumped from 38% to 61% in two months.</p><span class="tag">Fintech</span><span class="tag">Mobile</span></div></div>
    <div class="card"><div class="cover" style="background:linear-gradient(135deg,#052e16,#14532d)">&#129516;</div><div class="body"><h3>Careline — Telehealth</h3><p>Built the consultation flow for a telehealth platform serving 40k+ patients monthly.</p><span class="tag">Health</span><span class="tag">Web App</span></div></div>
    <div class="card"><div class="cover" style="background:linear-gradient(135deg,#1e1e2e,#312e81)">&#128295;</div><div class="body"><h3>DeployKit — Dev Tools</h3><p>Designed a deployment dashboard used by 12k developers; support tickets dropped 45%.</p><span class="tag">DevTools</span><span class="tag">SaaS</span></div></div>
  </div>
</section>
<section id="exp" class="section">
  <h2>Experience</h2>
  <div class="sub">Where I&rsquo;ve been and what I built.</div>
  <div class="timeline">
    <div class="titem"><h3>Senior Product Designer</h3><div class="co">Lumen Labs &mdash; 2023 &rarr; Present</div><p>Lead designer for the analytics suite. Grew NPS from 32 to 51 and introduced the design system still used by all squads.</p></div>
    <div class="titem"><h3>Product Designer</h3><div class="co">BrightPay &mdash; 2020 &rarr; 2023</div><p>Owned the consumer payments flow end-to-end. Shipped 14 major releases and won two internal design awards.</p></div>
    <div class="titem"><h3>UI/UX Designer</h3><div class="co">StudioNova &mdash; 2018 &rarr; 2020</div><p>Delivered 30+ brand sites and app designs for clients across travel, education and retail.</p></div>
  </div>
</section>
<section id="contact" class="section contact">
  <h2>Let&rsquo;s build something great</h2>
  <form onsubmit="return sendMsg(event)">
    <input id="cName" placeholder="Your name" />
    <input id="cEmail" placeholder="Email address" type="email" />
    <textarea id="cMsg" placeholder="Tell me about your project..." rows="4"></textarea>
    <div class="err" id="cErr"></div>
    <button class="btn" type="submit" style="border:none; cursor:pointer">Send Message</button>
    <div class="ok" id="cOk"></div>
  </form>
</section>
<footer>&#169; 2026 Aarav Mehta. Designed &amp; built with care.</footer>
<script>
  function closeMenu() { document.getElementById('mm').classList.remove('open'); }
  function sendMsg(e) {
    e.preventDefault();
    var n = document.getElementById('cName').value.trim();
    var em = document.getElementById('cEmail').value.trim();
    var m = document.getElementById('cMsg').value.trim();
    var err = document.getElementById('cErr');
    if (!n) { err.textContent = 'Please enter your name.'; return false; }
    if (!em || em.indexOf('@') === -1) { err.textContent = 'Please enter a valid email address.'; return false; }
    if (m.length < 10) { err.textContent = 'Message should be at least 10 characters.'; return false; }
    err.textContent = '';
    document.getElementById('cOk').textContent = '&#10003; Thanks ' + n + '! I\u2019ll reply within 24 hours.';
    document.getElementById('cName').value = '';
    document.getElementById('cEmail').value = '';
    document.getElementById('cMsg').value = '';
    return false;
  }
</script>
</body>
</html>`;
}

function buildFallbackApp(promptText: string): GeneratedFile[] {
  const p = promptText.toLowerCase();
  let indexHtml: string;
  if (/(todo|task|to-do|checklist|productivity)/.test(p)) indexHtml = fallbackTodoApp();
  else if (/(portfolio|resume|personal website|profile|designer)/.test(p)) indexHtml = fallbackPortfolioApp();
  else if (/(ecommerce|e-commerce|shop|store|product|sell|shopping)/.test(p)) indexHtml = fallbackShopApp();
  else if (/(dashboard|analytics|admin|saas|billing|report|charts|metrics)/.test(p)) indexHtml = fallbackDashboardApp();
  else if (/(calculator|calculate)/.test(p)) indexHtml = fallbackCalculatorApp();
  else if (/(quiz|trivia|test|exam|question)/.test(p)) indexHtml = fallbackQuizApp();
  else if (/(weather|forecast|temperature|climate)/.test(p)) indexHtml = fallbackWeatherApp();
  else if (/(chat|messenger|message|whatsapp|chatbot|chatbot)/.test(p)) indexHtml = fallbackChatApp();
  else if (/(notes|note-taking|memo|journal|notebook)/.test(p)) indexHtml = fallbackNotesApp();
  else indexHtml = fallbackLandingApp();
  return [
    { path: "index.html", content: indexHtml },
    { path: "src/App.js", content: buildCodePreview(promptText) },
    { path: "README.md", content: buildReadme(promptText) },
  ];
}

const getFallbackIndexHtml = (promptText: string): string => buildFallbackApp(promptText)[0].content;

function formatAiAnswer(raw: string, parsed: any): string | null {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  if (!cleaned) return null;

  const files = parsed?.files;
  if (files && typeof files === "object") {
    const paths = Object.keys(files);
    if (paths.length > 0) {
      const preview = paths.slice(0, 4).join(", ");
      return `Generated ${paths.length} file${paths.length === 1 ? "" : "s"}: ${preview}${paths.length > 4 ? "…" : ""}`;
    }
  }

  const plainText = cleaned
    .replace(/^\{.*\}$/s, "")
    .replace(/"/g, "")
    .replace(/\\n/g, " ")
    .trim();

  if (!plainText) return "App generated successfully.";
  return plainText.length > 220 ? `${plainText.slice(0, 220)}…` : plainText;
}


/* â”€â”€â”€ helpers â”€â”€â”€ */
function getPlanLabel(plan?: string | null): string {
  if (plan === "1000") return "Ultra";
  if (plan === "500") return "Max";
  if (plan === "200") return "Pro";
  return "Free";
}

function extractJsonObject(text: string): any {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function extractFilesFromRaw(raw: string): GeneratedFile[] | null {
  const toFiles = (filesMap: any): GeneratedFile[] | null => {
    if (!filesMap || typeof filesMap !== "object") return null;
    const files = Object.entries(filesMap)
      .filter(([, content]) => typeof content === "string" && (content as string).trim().length > 0)
      .map(([path, content]) => ({ path, content: content as string }));
    return files.length > 0 ? files : null;
  };

  const parsed = extractJsonObject(raw);
  const direct = toFiles(parsed?.files);
  if (direct) return direct;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/g);
  if (fenced) {
    for (const block of fenced) {
      const inner = block.replace(/```(?:json)?\s*/gi, "").replace(/```$/g, "").trim();
      const parsedInner = extractJsonObject(inner);
      const fromBlock = toFiles(parsedInner?.files);
      if (fromBlock) return fromBlock;
    }
  }

  const rawFilesMatch = raw.match(/"files"\s*:\s*(\{[\s\S]*\})/);
  if (rawFilesMatch) {
    const parsedRaw = extractJsonObject(rawFilesMatch[1]);
    const fromRaw = toFiles(parsedRaw?.files);
    if (fromRaw) return fromRaw;
  }

  return null;
}


function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let level = root;
    let acc = "";
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isLast = i === parts.length - 1;
      let node = level.find(
        (n) => n.name === part && n.type === (isLast ? "file" : "folder")
      );
      if (!node) {
        node = {
          name: part,
          path: acc,
          type: isLast ? "file" : "folder",
          children: isLast ? undefined : [],
        };
        level.push(node);
      }
      if (!isLast && node.children) level = node.children;
    });
  }
  return root;
}

const FILE_ICONS: Record<string, any> = {
  ".html": FileCode,
  ".js": FileCode,
  ".jsx": FileCode,
  ".ts": FileCode,
  ".tsx": FileCode,
  ".css": FileCode,
  ".json": FileCode,
  ".md": FileText,
};

function iconForPath(path: string) {
  const ext = "." + path.split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] ?? FileCode;
}

function fileName(path: string) {
  return path.split("/").pop() ?? path;
}

function fileIconColor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "html") return "text-orange-400";
  if (ext === "js" || ext === "jsx") return "text-yellow-400";
  if (ext === "ts" || ext === "tsx") return "text-blue-400";
  if (ext === "css") return "text-purple-400";
  if (ext === "json") return "text-amber-300";
  if (ext === "md") return "text-[#94a3b8]";
  return "text-[#64748b]";
}

function languageForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "html") return "HTML";
  if (ext === "js") return "JavaScript";
  if (ext === "jsx") return "JSX";
  if (ext === "ts") return "TypeScript";
  if (ext === "tsx") return "TSX";
  if (ext === "css") return "CSS";
  if (ext === "json") return "JSON";
  if (ext === "md") return "Markdown";
  return "Plain Text";
}

/* â”€â”€â”€ File tree item (dark theme) â”€â”€â”€ */
function TreeItem({
  node,
  depth,
  activePath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isActive = node.type === "file" && node.path === activePath;

  if (node.type === "folder") {
    const FolderIcon = open ? FolderOpen : Folder;
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ paddingLeft: 10 + depth * 14 }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-[#94a3b8] hover:bg-white/[0.04] hover:text-[#e2e8f0] transition-colors"
        >
          <ChevronRight
            className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
          <FolderIcon className="h-4 w-4 shrink-0 text-[#60a5fa]" />
          <span className="truncate">{node.name}</span>
        </button>
        {open &&
          node.children?.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  const FileIcon = iconForPath(node.path);
  const ext = node.name.split(".").pop()?.toLowerCase();
  const iconColor =
    ext === "html"
      ? "text-orange-400"
      : ext === "js" || ext === "jsx"
        ? "text-yellow-400"
        : ext === "ts" || ext === "tsx"
          ? "text-blue-400"
          : ext === "css"
            ? "text-purple-400"
            : ext === "md"
              ? "text-[#94a3b8]"
              : "text-[#64748b]";

  return (
    <button
      onClick={() => onSelect(node.path)}
      style={{ paddingLeft: 10 + depth * 14 }}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-all duration-150 ${
        isActive
          ? "bg-[#7c3aed]/15 text-[#c4b5fd] font-semibold"
          : "text-[#94a3b8] hover:bg-white/[0.04] hover:text-[#e2e8f0]"
      }`}
    >
      <FileIcon
        className={`h-4 w-4 shrink-0 ${isActive ? "text-[#a78bfa]" : iconColor}`}
      />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

/* â”€â”€â”€ Typing dots â”€â”€â”€ */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot"
          style={{
            animationDelay: `${i * 160}ms`,
            background: "#a78bfa",
          }}
        />
      ))}
    </span>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN PAGE COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function ApexCodePage() {
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [plan] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const match = document.cookie.split("; ").find((c) => c.startsWith("user_plan="));
    if (!match) return null;
    try {
      return decodeURIComponent(match.slice("user_plan=".length));
    } catch {
      return match.slice("user_plan=".length);
    }
  });
  const [promptHistory, setPromptHistory] = useState<PromptMessage[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationRecord[]>([]);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [filesOpen, setFilesOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");
  const [codeMode, setCodeMode] = useState<"full" | "file">("full");
  const [previewKey, setPreviewKey] = useState(0);
  const [device, setDevice] = useState<"laptop" | "tablet" | "phone">("laptop");
  const isResizing = useRef(false);
  const [typingMessage, setTypingMessage] = useState(THINKING_MESSAGES[0]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number } | null>(null);
  const requestIdRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);


  /* â”€â”€â”€ Rotating thinking message â”€â”€â”€ */
  useEffect(() => {
    if (!isGenerating) return;
    let index = Math.floor(Math.random() * THINKING_MESSAGES.length);
    setTypingMessage(THINKING_MESSAGES[index]);
    const interval = window.setInterval(() => {
      index = (index + 1) % THINKING_MESSAGES.length;
      setTypingMessage(THINKING_MESSAGES[index]);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [isGenerating]);


  /* â”€â”€â”€ Resize handler â”€â”€â”€ */
  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMove = (ev: PointerEvent) => {
      if (!isResizing.current) return;
      const next = Math.min(640, Math.max(300, startWidth + (ev.clientX - startX)));
      setSidebarWidth(next);
    };

    const onUp = () => {
      isResizing.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* â”€â”€â”€ Generate app â”€â”€â”€ */
  const requestBuildFiles = async (
    promptText: string,
    modelName?: string
  ): Promise<{ files: GeneratedFile[]; raw: string }> => {
    const callModel = async (systemPrompt: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: promptText,
          model: modelName ?? "Apex 2.2 (High)",
          intent: "build_app",
          responseMode: "raw",
          system_prompt: systemPrompt,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data?.error ?? data?.message ?? "AI request failed";
        const err = new Error(message) as Error & { quota?: boolean };
        err.quota = Boolean(data?.quotaExceeded);
        throw err;
      }
      return typeof data?.response === "string"
        ? data.response
        : typeof data?.assistant_response === "string"
          ? data.assistant_response
          : "";
    };

    let raw = await callModel(APP_BUILD_SYSTEM_PROMPT);
    let files = extractFilesFromRaw(raw);
    if (!files) {
      raw = await callModel(APP_BUILD_RETRY_PROMPT);
      files = extractFilesFromRaw(raw);
    }
    if (!files || files.length === 0) {
      const err = new Error("The model did not return valid application files") as Error & { quota?: boolean };
      err.quota = false;
      throw err;
    }
    return { files, raw };
  };

  const generateApp = async (promptText: string, modelName?: string) => {
    const requestId = ++requestIdRef.current;
    setBuildStep(1);
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const { files, raw } = await requestBuildFiles(promptText, modelName);
      if (requestId !== requestIdRef.current) return;
      const parsed = extractJsonObject(raw);
      const answerText = formatAiAnswer(raw, parsed);
      const selectedFile = files.find((f) => f.path.toLowerCase().endsWith(".html"))?.path ?? files[0].path;
      setAiAnswer(answerText);
      commitGeneration(promptText, files, selectedFile, answerText);
    } catch (error: any) {
      if (requestId !== requestIdRef.current) return;
      console.error("App generation failed", error);
      if (error?.quota) {
        setGenerationError(error.message || "AI usage is exhausted. Please try again later.");
        return;
      }
      const fallback = buildFallbackApp(promptText);
      const selectedFile = fallback.find((f) => f.path.toLowerCase().endsWith(".html"))?.path ?? fallback[0].path;
      setAiAnswer(`Generated ${fallback.length} files: ${fallback.map((f) => f.path).join(", ")}`);
      commitGeneration(promptText, fallback, selectedFile, null);
    } finally {
      if (requestId === requestIdRef.current) {
        setBuildStep(3);
        setIsGenerating(false);
      }
    }
  };

  const handleGenerate = (promptText: string, modelName?: string) => {
    const nextHistory = [...promptHistory, { id: `prompt-${Date.now()}`, text: promptText }];
    setActivePrompt(promptText);
    setPromptHistory(nextHistory);
    setGeneratedFiles([]);
    setActiveFile(null);
    setOpenTabs([]);
    setViewMode("code");
    setCodeMode("full");
    setBuildStep(1);
    setCursorPos(null);
    setGenerationError(null);
    setAiAnswer(null);
    setTimeout(() => setBuildStep(2), 900);
    generateApp(promptText, modelName);
  };

  const resetApp = () => {
    setActivePrompt(null);
    setActiveGenerationId(null);
    setPromptHistory([]);
    setBuildStep(0);
    setGeneratedFiles([]);
    setActiveFile(null);
    setOpenTabs([]);
    setCursorPos(null);
    setGenerationError(null);
    setAiAnswer(null);
    setViewMode("code");
    setCodeMode("full");
  };

  const openFileInTab = (path: string) => {
    setCodeMode("file");
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setActiveFile(path);
    if (viewMode === "preview" && path.toLowerCase().endsWith(".html")) {
      setPreviewKey((k) => k + 1);
    }
  };

  const closeTab = (path: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((p) => p !== path);
      if (next.length === 0) {
        setActiveFile(null);
      } else if (activeFile === path) {
        setActiveFile(next[next.length - 1]);
      }
      return next;
    });
  };

  const tree = useMemo(() => buildTree(generatedFiles), [generatedFiles]);

  const activeFileContent = useMemo(
    () => generatedFiles.find((f) => f.path === activeFile)?.content ?? "",
    [generatedFiles, activeFile]
  );

  const previewHtml = useMemo(() => {
    const htmlFile = generatedFiles.find((f) =>
      f.path.toLowerCase().endsWith(".html")
    );
    if (htmlFile) return htmlFile.content;
    return getFallbackIndexHtml(activePrompt ?? "App Workspace");
  }, [generatedFiles, activePrompt]);

  const fullGeneratedCode = useMemo(() => {
    if (generatedFiles.length === 0) return "";
    return generatedFiles
      .map((file, index) => `/* FILE ${index + 1}: ${file.path} */\n${file.content}`)
      .join("\n\n");
  }, [generatedFiles]);

  const displayedCode = codeMode === "full" ? fullGeneratedCode : activeFileContent;

  const copyDisplayedCode = async () => {
    try {
      await navigator.clipboard.writeText(displayedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable
    }
  };

  const commitGeneration = (
    promptText: string,
    files: GeneratedFile[],
    selectedFile: string | null,
    answer: string | null = null
  ) => {
    const record: GenerationRecord = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt: promptText,
      files,
      activeFile: selectedFile,
      createdAt: Date.now(),
      answer,
    };

    setGenerationHistory((prev) => [...prev, record].slice(-12));

    setActiveGenerationId(record.id);
    setActivePrompt(promptText);
    setGeneratedFiles(files);
    setActiveFile(selectedFile);
    setOpenTabs(selectedFile ? [selectedFile] : []);
    setGenerationError(null);
    setCodeMode("full");
  };

  const selectGeneration = (record: GenerationRecord) => {
    setActiveGenerationId(record.id);
    setActivePrompt(record.prompt);
    setGeneratedFiles(record.files);
    const firstFile = record.activeFile ?? record.files[0]?.path ?? null;
    setActiveFile(firstFile);
    setOpenTabs(firstFile ? [firstFile] : []);
    setAiAnswer(record.answer ?? null);
    setGenerationError(null);
    setBuildStep(3);
    setIsGenerating(false);
    setViewMode("code");
    setCodeMode("full");
  };
  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     RENDER
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <div className={`w-full bg-[#0a0a14] relative ${!activePrompt ? "min-h-screen overflow-y-auto" : "h-screen overflow-hidden"}`}>
      {/* â”€â”€â”€ HERO (no prompt yet) â”€â”€â”€ */}
      {!activePrompt ? (
        <div className="min-h-screen w-full flex flex-col items-center justify-start px-4 md:px-6 py-10 md:py-12 relative md:justify-center">
          {/* Subtle background gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#7c3aed]/[0.06] blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.06] blur-[100px]" />
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="relative h-12 w-12">
              <Image
                src="/proper_octopus_transparent.png"
                alt="ApexCode logo"
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
            <span className="bg-gradient-to-r from-[#a78bfa] via-[#60a5fa] to-[#34d399] bg-clip-text text-3xl md:text-4xl font-bold tracking-tight text-transparent">
              ApexCode
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#e2e8f0] font-sans mb-3 text-center relative z-10">
            What do you want to build?
          </h1>
          <p className="text-[#64748b] text-base mb-8 text-center relative z-10">
            Describe your app and ApexCode will generate it instantly
          </p>

          <div className="relative z-10 w-full max-w-[720px]">
            <ApexCodeSearchBar onGenerate={handleGenerate} />
          </div>
        </div>
      ) : (
        /* â”€â”€â”€ WORKSPACE (two-panel layout) â”€â”€â”€ */
<div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
          {/* LEFT PANEL chat/prompt */}
          <aside
            style={{ ["--panel-w" as any]: `${sidebarWidth}px` }}
            className="relative flex h-[42vh] md:h-full w-full md:w-[var(--panel-w)] md:max-w-full shrink-0 flex-col border-b md:border-b-0 md:border-r border-white/[0.06] overflow-hidden"
          >
            {/* Panel background */}
            <div className="absolute inset-0 w-full bg-gradient-to-b from-[#0f0f23] via-[#0d0d1f] to-[#0a0a18] md:w-[var(--panel-w)]" />

            {/* Header */}
            <div className="relative z-10 flex items-center gap-2.5 px-5 pt-5 pb-3">
              <div className="relative h-9 w-9">
                <Image
                  src="/proper_octopus_transparent.png"
                  alt="ApexCode logo"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <span className="bg-gradient-to-r from-[#a78bfa] via-[#60a5fa] to-[#34d399] bg-clip-text text-xl font-bold tracking-tight text-transparent">
                ApexCode
              </span>
            </div>

            {/* Scrollable chat area */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-4 pt-3">
              <div className="space-y-4 pb-3">
                {generationHistory.map((record, index) => {
                  const isActive = record.id === activeGenerationId;
                  return (
                    <div key={record.id} className={`apexcode-fade-in ${index > 0 ? "pt-2" : ""}`}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-[#64748b]">You</span>
                        <span className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${
                          isActive ? "text-[#c4b5fd]" : "text-[#64748b]"
                        }`}>
                          {isActive ? "Active" : "Saved"}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <p className="max-w-[85%] text-right text-[13px] leading-relaxed text-[#e2e8f0]">
                          {record.prompt}
                        </p>
                      </div>

                      <div className="mt-3 flex items-start gap-2">
                        <span className="mt-1 text-[11px] font-medium text-[#64748b]">ApexCode AI</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] leading-relaxed text-[#e2e8f0]">
                            <CheckCircle2 className="mr-1 inline-block h-4 w-4 align-[-2px] text-emerald-400" />
                            {record.files.length} files generated
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {record.files.map((file, fileIndex) => (
                              <button
                                key={file.path}
                                type="button"
                                onClick={() => selectGeneration(record)}
                                style={{ animationDelay: `${fileIndex * 120}ms` }}
                                className="apexcode-fade-in block w-full text-left text-[11px] font-mono text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
                              >
                                <span className="mr-2 text-[#475569]">{fileIndex + 1}.</span>
                                <span className="break-all">{file.path}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isGenerating && (
                  <div className="apexcode-fade-in">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 text-[11px] font-medium text-[#64748b]">ApexCode AI</span>
                      <div className="max-w-[85%]">
                        <TypingDots />
                        <p className="mt-2 text-[11px] leading-snug text-[#64748b]">
                          {typingMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {generationError ? (
                  <div className="apexcode-fade-in rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
                        Generation failed
                      </span>
                    </div>
                    <p className="text-[12px] leading-6 text-[#e2e8f0]">{generationError}</p>
                  </div>
                ) : aiAnswer ? (
                  <div className="apexcode-fade-in rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c4b5fd]">
                        AI answer
                      </span>
                      <span className="text-[10px] text-[#64748b]">Latest response</span>
                    </div>
                    <p className="max-h-[120px] overflow-y-auto whitespace-pre-wrap break-words text-[12px] leading-6 text-[#e2e8f0]">
                      {aiAnswer}
                    </p>
                  </div>
                ) : null}
              </div>
              <div ref={chatEndRef} />
            </div>

            {/* Bottom: pinned search bar */}
            <div className="relative z-10 shrink-0 border-t border-white/[0.06] bg-[#0a0a18] p-3 shadow-[0_-10px_24px_rgba(2,6,23,0.45)]">
              <ApexCodeSearchBar onGenerate={handleGenerate} showQuickHints={false} />
            </div>
          </aside>

          {/* â•â•â• DRAG RESIZER â•â•â• */}
          <div
            onPointerDown={startResize}
            title="Drag to resize"
            className="hidden md:flex w-[6px] shrink-0 -mx-[3px] cursor-col-resize items-center justify-end pr-px bg-transparent group touch-none relative z-20"
          >
            {/* Visible handle pill */}
            <div className="mr-[1px] h-12 w-[3px] rounded-full bg-white/[0.08] transition-all duration-200 group-hover:bg-[#7c3aed]/60 group-hover:h-16 group-hover:w-[4px] group-hover:shadow-[0_0_12px_rgba(124,58,237,0.3)] group-active:bg-[#3b82f6]/70 group-active:shadow-[0_0_16px_rgba(59,130,246,0.4)]" />
          </div>

          {/* â•â•â• RIGHT PANEL â€” Workspace â•â•â• */}
          <main className="relative flex flex-1 flex-col min-w-0 bg-[#0c0c1a] overflow-hidden">
{/* Top toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-4 py-2.5 border-b border-white/[0.06] bg-[#0e0e1e]/80 backdrop-blur-md shrink-0">
              {/* Left: View mode tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
                <button
                  onClick={() => setViewMode("code")}
                  title="Code view"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    viewMode === "code"
                      ? "bg-[#7c3aed]/20 text-[#c4b5fd] shadow-sm shadow-[#7c3aed]/10"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Code</span>
                </button>
                <button
                  onClick={() => setViewMode("preview")}
                  title="Preview view"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    viewMode === "preview"
                      ? "bg-[#7c3aed]/20 text-[#c4b5fd] shadow-sm shadow-[#7c3aed]/10"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <span className="apexcode-status-pulse flex items-center gap-1.5 rounded-full bg-[#7c3aed]/15 border border-[#7c3aed]/20 px-3 py-1.5 text-[11px] font-semibold text-[#a78bfa]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </span>
                ) : buildStep >= 3 ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete
                  </span>
                ) : null}

                <button
                  onClick={() => setFilesOpen((v) => !v)}
                  title="Toggle file explorer"
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    filesOpen
                      ? "border-[#7c3aed]/30 bg-[#7c3aed]/10 text-[#c4b5fd]"
                      : "border-white/[0.06] bg-white/[0.03] text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <Files className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Explorer</span>
                </button>

                {viewMode === "preview" && (
                  <>
                    <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
                      <button
                        onClick={() => setDevice("laptop")}
                        title="Laptop preview"
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                          device === "laptop"
                            ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                            : "text-[#64748b] hover:text-[#94a3b8]"
                        }`}
                      >
                        <Monitor className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDevice("tablet")}
                        title="Tablet preview"
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                          device === "tablet"
                            ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                            : "text-[#64748b] hover:text-[#94a3b8]"
                        }`}
                      >
                        <Tablet className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDevice("phone")}
                        title="Phone preview"
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                          device === "phone"
                            ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                            : "text-[#64748b] hover:text-[#94a3b8]"
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setPreviewKey((k) => k + 1)}
                      title="Refresh preview"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.05] transition-all duration-200"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}

                <Link
                  href="/settings"
                  title="Settings"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.05] transition-all duration-200"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Link>

                <button
                  onClick={resetApp}
                  title="Start a new prompt"
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] hover:from-[#6d28d9] hover:to-[#2563eb] text-xs font-medium text-white transition-all duration-200 shadow-lg shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/30"
                >
                  New Prompt
                </button>
              </div>
            </div>

            {/* Content area: Explorer + Code/Preview */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* File Explorer sidebar */}
              {filesOpen && (
                <aside className="w-full lg:w-56 lg:w-60 lg:shrink-0 lg:border-r border-white/[0.06] bg-[#0b0b19] overflow-y-auto flex flex-col max-h-44 lg:max-h-none">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b] flex items-center gap-1.5">
                      <Files className="h-3.5 w-3.5" />
                      Explorer
                    </p>
                    <span className="text-[10px] text-[#475569] font-mono">
                      {generatedFiles.length} files
                    </span>
                  </div>


                  <div className="flex-1 p-2 space-y-0.5">
                    {tree.map((node) => (
                      <TreeItem
                        key={node.path}
                        node={node}
                        depth={0}
                        activePath={activeFile}
                        onSelect={openFileInTab}
                      />
                    ))}
                    {generatedFiles.length === 0 && (
                      <div className="flex items-center gap-2 px-2 py-3 text-xs text-[#475569]">
                        <Loader2 className="h-4 w-4 animate-spin text-[#7c3aed]" />
                        Preparing files...
                      </div>
                    )}
                  </div>
                </aside>
              )}

              {/* Code / Preview content */}
              <div className="flex-1 min-w-0 p-3 md:p-4 overflow-hidden">
                {viewMode === "code" ? (
                  <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.06] bg-[#1e1e2e]">
                    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] bg-[#181825] px-3 py-2.5 shrink-0">
                      <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
                        <button
                          onClick={() => setCodeMode("full")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            codeMode === "full"
                              ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                              : "text-[#7f849c] hover:text-[#cdd6f4]"
                          }`}
                        >
                          Full
                        </button>
                        <button
                          onClick={() => setCodeMode("file")}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            codeMode === "file"
                              ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                              : "text-[#7f849c] hover:text-[#cdd6f4]"
                          }`}
                        >
                          File
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {codeMode === "file" && isGenerating && (
                          <span className="flex items-center gap-1 text-[10px] text-[#a78bfa]">
                            <PenLine className="h-3 w-3" />
                            writing...
                          </span>
                        )}
                        <button
                          onClick={copyDisplayedCode}
                          disabled={!displayedCode}
                          className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-[#a6adc8] transition-colors disabled:opacity-30"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 text-[#a6e3a1]" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              {codeMode === "full" ? "Copy All" : "Copy"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {codeMode === "full" ? (
                      <div className="flex-1 overflow-auto p-4">
                        <div className="rounded-2xl border border-white/[0.06] bg-[#181825] p-4">
                          <div className="mb-4 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c4b5fd]">
                                Full generated code
                              </p>
                              <p className="text-[11px] text-[#7f849c]">
                                Every generated file is shown inside one boxed output
                              </p>
                            </div>
                            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[10px] font-mono text-[#a6adc8]">
                              {generatedFiles.length} files
                            </span>
                          </div>

                          {generatedFiles.length > 0 ? (
                            <div className="space-y-4">
                              {generatedFiles.map((file, index) => (
                                <section key={file.path} className="overflow-hidden rounded-xl border border-white/[0.05] bg-[#11111c]">
                                  <div className="flex items-center justify-between gap-2 border-b border-white/[0.04] px-4 py-2.5">
                                    <div className="min-w-0">
                                      <p className="text-[9px] uppercase tracking-[0.16em] text-[#7c3aed]">
                                        File {index + 1}
                                      </p>
                                      <p className="truncate font-mono text-xs text-[#cdd6f4]">
                                        {file.path}
                                      </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-white/[0.04] px-2 py-1 text-[10px] text-[#94a3b8]">
                                      code
                                    </span>
                                  </div>
                                  <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed font-mono text-[#cdd6f4] whitespace-pre">
                                    {file.content || "// Empty file"}
                                  </pre>
                                </section>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-sm text-[#94a3b8]">
                              Generating full code files...
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Editor tab bar with multi-file tabs */}
                        <div className="flex items-stretch bg-[#181825] border-b border-white/[0.04] shrink-0 min-w-0">
                          <div className="hidden sm:flex items-center gap-1.5 px-4 border-r border-white/[0.04]">
                            <span className="h-3 w-3 rounded-full bg-[#f38ba8]/80" />
                            <span className="h-3 w-3 rounded-full bg-[#f9e2af]/80" />
                            <span className="h-3 w-3 rounded-full bg-[#a6e3a1]/80" />
                          </div>
                          <div className="flex flex-1 min-w-0 items-stretch overflow-x-auto">
                            {openTabs.map((path) => {
                              const TabIcon = iconForPath(path);
                              const isTabActive = path === activeFile;
                              return (
                                <div
                                  key={path}
                                  onClick={() => setActiveFile(path)}
                                  title={path}
                                  className={`group flex shrink-0 cursor-pointer items-center gap-2 border-r border-white/[0.04] px-3 py-2 text-xs font-mono transition-colors ${
                                    isTabActive
                                      ? "bg-[#1e1e2e] text-[#cdd6f4] shadow-[inset_0_2px_0_0_#a78bfa]"
                                      : "text-[#7f849c] hover:bg-white/[0.03] hover:text-[#cdd6f4]"
                                  }`}
                                >
                                  <TabIcon
                                    className={`h-3.5 w-3.5 shrink-0 ${
                                      isTabActive ? "text-[#a78bfa]" : fileIconColor(path)
                                    }`}
                                  />
                                  <span className="max-w-[150px] truncate">{fileName(path)}</span>
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      closeTab(path);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.stopPropagation();
                                        closeTab(path);
                                      }
                                    }}
                                    aria-label={`Close ${path}`}
                                    className="rounded p-0.5 text-[#585b70] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/[0.08] hover:text-[#f38ba8]"
                                  >
                                    <X className="h-3 w-3" />
                                  </span>
                                </div>
                              );
                            })}
                            {openTabs.length === 0 && !isGenerating && (
                              <span className="px-4 py-2.5 text-[11px] font-mono text-[#585b70]">
                                No file open — pick one from the explorer
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Code with line numbers */}
                        <pre className="flex-1 overflow-auto p-4 text-[13px] leading-relaxed font-mono text-[#cdd6f4]">
                          {displayedCode.split("\n").map((line, i) => (
                            <div
                              key={i}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const col = Math.max(1, Math.round((e.clientX - rect.left) / 7.8));
                                setCursorPos({ line: i + 1, col });
                              }}
                              className="flex hover:bg-white/[0.02] transition-colors cursor-text"
                            >
                              <span className="w-10 shrink-0 select-none text-right pr-4 text-[#585b70]">
                                {i + 1}
                              </span>
                              <span className="whitespace-pre">
                                <CodeSyntaxLine line={line} />
                              </span>
                            </div>
                          ))}
                          {!activeFile && (
                            <div className="flex items-center gap-2 text-[#585b70]">
                              <Loader2 className="h-4 w-4 animate-spin text-[#7c3aed]" />
                              Generating code files...
                            </div>
                          )}
                        </pre>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.06] bg-[#0f0f23]">
                    {/* Preview browser bar */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#181825] border-b border-white/[0.04] shrink-0">
                      <div className="flex items-center gap-1.5 mr-3">
                        <span className="h-3 w-3 rounded-full bg-[#f38ba8]/80" />
                        <span className="h-3 w-3 rounded-full bg-[#f9e2af]/80" />
                        <span className="h-3 w-3 rounded-full bg-[#a6e3a1]/80" />
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[11px] font-mono text-[#64748b]">
                          {device === "phone"
                            ? "Phone"
                            : device === "tablet"
                              ? "Tablet"
                              : "Laptop"}{" "}
                          · vedaapex.com
                        </span>
                      </div>
                    </div>
                    {/* Device frame */}
                    <div className="flex-1 flex items-center justify-center overflow-y-auto p-4">
                      {device === "laptop" ? (
                        <iframe
                          key={previewKey}
                          srcDoc={previewHtml}
                          title="App Preview"
                          sandbox="allow-scripts"
                          className="h-full w-full rounded-b-lg bg-white"
                        />
                      ) : (
                        <div
                          style={{
                            width: device === "tablet" ? 768 : 375,
                            maxWidth: "100%",
                          }}
                          className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#0d0d1f] shadow-2xl shadow-black/60"
                        >
                          {/* Device status bar */}
                          <div className="shrink-0 flex items-center justify-center px-4 py-2 bg-[#181825]">
                            <span className="h-1.5 w-20 rounded-full bg-white/20" />
                          </div>
                          <iframe
                            key={`${previewKey}-${device}`}
                            srcDoc={previewHtml}
                            title="App Preview"
                            sandbox="allow-scripts"
                            className="flex-1 w-full rounded-b-[16px] bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </div>
              {/* IDE status bar */}
              <div className="flex items-center justify-between gap-3 px-3 md:px-4 py-1.5 bg-[#181825] border-t border-white/[0.04] text-[11px] font-mono text-[#7f849c] shrink-0 select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex items-center gap-1 text-[#a78bfa]">
                    <GitBranch className="h-3 w-3" />
                    main
                  </span>
                  <span className="hidden sm:inline">{generatedFiles.length} files</span>
                  {isGenerating ? (
                    <span className="flex items-center gap-1.5 text-[#a78bfa]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </span>
                  ) : buildStep >= 3 ? (
                    <span className="flex items-center gap-1 text-[#a6e3a1]">
                      <CheckCircle2 className="h-3 w-3" />
                      Ready
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  {activeFile && (
                    <>
                      <span>{languageForPath(activeFile)}</span>
                      {cursorPos && (
                        <span className="hidden sm:inline">
                          Ln {cursorPos.line}, Col {cursorPos.col}
                        </span>
                      )}
                    </>
                  )}
                  <span className="hidden md:inline">Spaces: 2</span>
                  <span className="hidden md:inline">UTF-8</span>
                  <span>LF</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

















