#!/usr/bin/env python3
# charts.py — the Divergence Foundry's numbers, in the SuperInstance palette.
import json, os
import matplotlib.font_manager as fm
for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
    if os.path.exists(p): fm.fontManager.addfont(p)
import matplotlib.pyplot as plt
plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

INK, PANEL, TIDE, TIDE2 = '#0D1524', '#121B2E', '#3FE0C5', '#4CF2D8'
ROSE, AMBER, TEXT, MUTED, GRID = '#E0637A', '#F2A64C', '#E8EEF6', '#8A97AB', '#243147'
plt.rcParams.update({
    'figure.facecolor': INK, 'axes.facecolor': PANEL, 'savefig.facecolor': INK,
    'axes.edgecolor': GRID, 'axes.labelcolor': TEXT, 'text.color': TEXT,
    'xtick.color': MUTED, 'ytick.color': MUTED, 'grid.color': GRID,
    'font.size': 11, 'axes.titlesize': 13, 'axes.titleweight': 'bold',
})

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'outputs')
os.makedirs(os.path.join(OUT, 'charts'), exist_ok=True)
data = json.load(open(os.path.join(OUT, 'results.json')))
reports = data['reports']

NAMES = {'mines_safe': 'Minesweeper safe-cells', 'reversi_flips': 'Reversi flips',
         'life_step': 'Conway life step', 'hearts_trick': 'Hearts trick winner',
         'holdem_cat': "Hold'em hand category",
         'pager_band': 'Fleet-pager hysteresis', 'witness_fnv': 'Witness fnv-1a-64',
         'cosine_sparse': 'Ocean-recall cosine', 'hand_eval5': "Hold'em 5-card eval",
         'gate_law': 'Cortex gate law'}
SERIES = [TIDE, AMBER, ROSE, TIDE2, '#9B8CF2', '#5FD3A5', '#F2A93B', '#7FB4F2', '#E06C9F', '#8CD867']

# ── 1. the divergence frontier ──
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12.5, 4.6), constrained_layout=True)
for i, r in enumerate(reports):
    curve = r['curve']
    gens = [c['gen'] for c in curve]
    ax1.plot(gens, [c['archive'] for c in curve], color=SERIES[i % 5], lw=2.2, label=NAMES[r['target']])
    ax2.plot(gens, [c['diversity'] for c in curve], color=SERIES[i % 5], lw=2.2)
ax1.set_title('Elite archive fills with divergent correct logic')
ax1.set_xlabel('generation'); ax1.set_ylabel('elites in archive')
ax1.grid(True, alpha=.5); ax1.legend(framealpha=.0, fontsize=9, labelcolor=TEXT)
ax2.set_title('Mean pairwise structural distance of elites')
ax2.set_xlabel('generation'); ax2.set_ylabel('diversity index')
ax2.grid(True, alpha=.5)
fig.suptitle('THE DIVERGENCE FRONTIER — quilt-loom offline run (960 candidates, 0 live calls)',
             color=TIDE, fontweight='bold', fontsize=14)
fig.savefig(os.path.join(OUT, 'charts', 'divergence_frontier.png'), dpi=150)
plt.close(fig)

# ── 2. verdict mix over generations (stacked) ──
fig, axes = plt.subplots(1, 5, figsize=(15.5, 3.4), constrained_layout=True, sharey=False)
for k, r in enumerate(reports):
    ax = axes[k]
    curve = r['curve']
    gens = [c['gen'] for c in curve]
    caught = [c['fakes'] for c in curve]
    crowned = [1 if c['crowned'] else 0 for c in curve]
    mimic = [c['cand_n'] - c['fakes'] - (1 if c['crowned'] else 0) for c in curve]
    ax.bar(gens, mimic, color=GRID, label='mimic', width=.8)
    ax.bar(gens, caught, bottom=mimic, color=ROSE, label='caught fake', width=.8)
    ax.bar(gens, crowned, bottom=[m + c for m, c in zip(mimic, caught)], color=TIDE, label='crowned', width=.8)
    ax.set_title(NAMES[r['target']], fontsize=10)
    ax.set_xlabel('gen')
    ax.grid(True, axis='y', alpha=.4)
    ax.set_xticks([1, 8, 16, 24])
axes[0].set_ylabel('candidates / gen')
axes[0].legend(framealpha=.0, fontsize=8, labelcolor=TEXT, loc='lower right')
fig.suptitle('THE GAN\'S LEDGER — mimics rejected · fakes caught · divergent logic crowned',
             color=TIDE, fontweight='bold', fontsize=13)
fig.savefig(os.path.join(OUT, 'charts', 'verdict_mix.png'), dpi=150)
plt.close(fig)

# ── 3. the archive wall: novelty vs corruption scatter per target ──
fig, axes = plt.subplots(1, 5, figsize=(15.5, 3.6), constrained_layout=True)
for k, r in enumerate(reports):
    ax = axes[k]
    if r['archive']:
        nov = [e['novelty'] for e in r['archive']]
        struct = [e['struct'] for e in r['archive']]
        fams = list(dict.fromkeys(e['family'] for e in r['archive']))
        fcolors = {f: SERIES[i % 5] for i, f in enumerate(fams)}
        cols = [fcolors[e['family']] for e in r['archive']]
        ax.scatter(struct, nov, s=90, c=cols, edgecolors=INK, linewidths=1.2, zorder=3)
        for e in r['archive']:
            ax.annotate(e['family'][:4], (e['struct'], e['novelty']),
                        textcoords='offset points', xytext=(6, 4), fontsize=6.5, color=MUTED)
    ax.set_title(NAMES[r['target']], fontsize=10)
    ax.set_xlabel('struct distance to nearest elite')
    ax.grid(True, alpha=.4)
axes[0].set_ylabel('composite novelty')
fig.suptitle('THE ARCHIVE WALL — every dot is a different CORRECT implementation of the same contract',
             color=TIDE, fontweight='bold', fontsize=13)
fig.savefig(os.path.join(OUT, 'charts', 'archive_wall.png'), dpi=150)
plt.close(fig)

print('charts written:', os.listdir(os.path.join(OUT, 'charts')))
