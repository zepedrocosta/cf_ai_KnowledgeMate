# AI Prompts Used During Development

This document records the AI prompts used during the development of KnowledgeMate.

## Initial Project Prompt

> I need to make an app for an application in cloudflare. This is the assignment.
> Optional Assignment: See instructions below for Cloudflare AI app assignment. SUBMIT GitHub repo URL for the AI project here.
> Optional Assignment Instructions: We plan to fast track review of candidates who complete an assignment to build a type of AI-powered application on Cloudflare. An AI-powered application should include the following components:
> - LLM (recommend using Llama 3.3 on Workers AI), or an external LLM of your choice
> - Workflow / coordination (recommend using Workflows, Workers or Durable Objects)
> - User input via chat or voice (recommend using Pages or Realtime)
> - Memory or state
>
> IMPORTANT NOTE: To be considered, your repository name must be prefixed with cf_ai_, must include a README.md file with project documentation and clear running instructions to try out components (either locally or via deployed link). AI-assisted coding is encouraged, but you must include AI prompts used in PROMPTS.md

## Architecture Planning Prompt

> I need to plan an AI-powered application built on Cloudflare's platform. Research the Cloudflare AI agents documentation and plan the architecture.
>
> Requirements:
> - Use an LLM (Llama 3.3 on Workers AI recommended)
> - Workflow/coordination using Workflows, Workers, or Durable Objects
> - User input via chat interface
> - Memory or state management
> - Must be deployable on Cloudflare
>
> The app idea: An AI-powered personal knowledge assistant / chatbot. Users can chat with an AI assistant powered by Llama 3.3. The AI remembers conversation context using Durable Objects for state.
>
> Plan the full architecture, file structure, and implementation strategy.

## Simplification Prompt

> I want a basic project. There is no need for database and advanced react stuff.

This led to simplifying the architecture from a React + SQLite note-taking app to a vanilla HTML/CSS/JS chat interface with in-memory conversation state.

## LLM System Prompt (Used in the Application)

The following system prompt is used at runtime when calling Llama 3.3 via Workers AI:

```
You are KnowledgeMate, a friendly and helpful AI knowledge assistant. You help users with questions, brainstorming, explanations, and general conversation.

Your key traits:
- You give clear, concise answers
- You can help with coding, writing, research, and creative tasks
- You remember the full conversation context
- When you don't know something, you say so honestly
- You format responses with markdown when helpful (lists, code blocks, bold, etc.)

Keep responses focused and useful. Avoid unnecessary filler.
```

## Development Tool

All code was developed with the assistance of **Claude Code** (Claude Opus 4.6), Anthropic's CLI coding assistant.
