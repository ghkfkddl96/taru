-- Taru WezTerm config (project-local, loaded via --config-file)
-- Goal: stable Korean rendering, no scroll-glitch on CJK wide chars.

local wezterm = require 'wezterm'
local config = wezterm.config_builder and wezterm.config_builder() or {}

-- Font fallback chain: English mono first, then CJK.
-- Malgun Gothic is bundled with Windows so the fallback is always available.
config.font = wezterm.font_with_fallback({
  'D2Coding',
  'Sarasa Mono K',
  'Consolas',
  'Malgun Gothic',
  'Segoe UI Emoji',
})
config.font_size = 11.0
config.line_height = 1.05

-- Treat ambiguous-width chars as narrow (avoids overlap with most CJK fonts).
config.treat_east_asian_ambiguous_width_as_wide = false

-- Big scrollback so launcher logs survive long sessions.
config.scrollback_lines = 50000

-- Tabs/decorations minimal.
config.hide_tab_bar_if_only_one_tab = true
config.window_decorations = 'TITLE | RESIZE'
config.window_padding = { left = 8, right = 8, top = 4, bottom = 4 }

-- Color scheme: dark, readable.
config.color_scheme = 'Tokyo Night'

-- Default shell: cmd.exe with UTF-8 codepage so node-pty I/O stays clean.
config.default_prog = { 'cmd.exe', '/k', 'chcp 65001 > nul' }

return config
