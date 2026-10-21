/**
 * Architecture diagram, drawn in box-drawing characters. Each line has a mask
 * of the same width: a letter tags the glyph above it with a part, so the
 * diagram can highlight the plane being described.
 *   c control plane · d data plane · p prompts · a actors · s structure
 */
const ART = String.raw`
 ┌─ portico-tui ───────────┐          ┌─ portico-gui ───────────┐
 sssssssssssssssssssssssssss          sssssssssssssssssssssssssss
 │ ratatui · alacritty     │          │ Tauri 2 · Svelte 5      │
 s                         s          s                         s
 └──┬─────────▲────────▲───┘          └──┬─────────▲────────▲───┘
 ssssssssssssscssssssssdssss          ssssssssssssscssssssssdssss
    │ cmd     │ events │ bytes           │ cmd     │ events │ bytes
    s sss     c cccccc d ddddd           s sss     c cccccc d ddddd
 ┌──▼─────────┴────────┴─────────────────▼─────────┴────────┴───┐
 ssssssssssssscssssssssdssssssssssssssssssssssssssscssssssssdssss
 │  portico-core                                                │
 s  ssssssssssss                                                s
 │                                                              │
 s                                                              s
 │  Engine ──────── broadcast<EngineEvent> ──────────────▶      │
 s  aaaaaa cccccccccccccccccccccccccccccccccccccccccccccccc     s
 │    │                                                         │
 s    a                                                         s
 │    ├─ session · actor ── russh::Handle                       │
 s    aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa                      s
 │    │    ├─ pty    ◀══ mpsc ×2, bounded ══▶  terminal         │
 s    a    aaaaaa    dddddddddddddddddddddddddddddddddd         s
 │    │    ├─ sftp                                              │
 s    a    aaaaaaa                                              s
 │    │    └─ -L / -R                                           │
 s    a    aaaaaaaaaa                                           s
 │    │                                                         │
 s    p                                                         s
 │    └─ prompt · oneshot<PromptId>  ◀── respond()              │
 s    pppppppppppppppppppppppppppppppppppppppppppp              s
 └──────────────────────────────────────────────────────────────┘
 ssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss
`;

export interface Cell {
  text: string;
  part: string;
}

/** Lines of runs `{ text, part }` (part '' = plain). */
export function diagramRuns(): Cell[][] {
  const raw = ART.split('\n').filter((l) => l.length > 0);
  const out: Cell[][] = [];
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const line = [...(raw[i] ?? '')];
    const mask = [...(raw[i + 1] ?? '')];
    const runs: Cell[] = [];
    line.forEach((ch, x) => {
      const m = mask[x] ?? ' ';
      const part = m === ' ' ? '' : m;
      const last = runs[runs.length - 1];
      if (last && last.part === part) last.text += ch;
      else runs.push({ text: ch, part });
    });
    out.push(runs);
  }
  return out;
}
