import { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Flow, Step, Group } from '../types';
import { STEP_TYPES } from '../constants';
import { allSteps } from '../lib/flow';
import { useTheme } from '../context/ThemeContext';

/* ── colour palette per step type ── */
const TYPE_COLORS_DARK: Record<string, { bg: string; border: string; text: string }> = {
  chat_agent: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  general_knowledge: { bg: '#1a3d2a', border: '#22c55e', text: '#86efac' },
  web_search: { bg: '#164e63', border: '#0ea5e9', text: '#7dd3fc' },
  ui_agent: { bg: '#422006', border: '#f59e0b', text: '#fcd34d' },
  create_image: { bg: '#4a1942', border: '#ec4899', text: '#f9a8d4' },
  quicksuite_data: { bg: '#2d1f5e', border: '#8b5cf6', text: '#c4b5fd' },
  dashboard_topics: { bg: '#1e1b4b', border: '#6366f1', text: '#a5b4fc' },
  app_actions: { bg: '#431407', border: '#f97316', text: '#fdba74' },
  user_input_text: { bg: '#3f3c0a', border: '#eab308', text: '#fde047' },
  user_input_files: { bg: '#431407', border: '#fb923c', text: '#fed7aa' },
};

const TYPE_COLORS_LIGHT: Record<string, { bg: string; border: string; text: string }> = {
  chat_agent: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  general_knowledge: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  web_search: { bg: '#cffafe', border: '#0ea5e9', text: '#0c4a6e' },
  ui_agent: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  create_image: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  quicksuite_data: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  dashboard_topics: { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  app_actions: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  user_input_text: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  user_input_files: { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
};

const GROUP_STYLE_DARK = { bg: '#2d1f5e', border: '#a78bfa', text: '#c4b5fd' };
const GROUP_STYLE_LIGHT = { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' };

const DEFAULT_COLOR_DARK = { bg: '#1e293b', border: '#64748b', text: '#94a3b8' };
const DEFAULT_COLOR_LIGHT = { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' };

/* ── Custom Step Node ── */
function StepNode({ data }: { data: { step: Step; index: number; isDark: boolean } }) {
  const { step, index, isDark } = data;
  const meta = STEP_TYPES.find((x) => x.value === step.type);
  const palette = isDark ? TYPE_COLORS_DARK : TYPE_COLORS_LIGHT;
  const defaultColor = isDark ? DEFAULT_COLOR_DARK : DEFAULT_COLOR_LIGHT;
  const colors = palette[step.type] ?? defaultColor;

  return (
    <div
      className="rounded-xl shadow-lg px-4 py-3 min-w-[220px] max-w-[300px] border-2 transition-shadow hover:shadow-xl"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 dark:!bg-slate-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{meta?.icon ?? '?'}</span>
        <span
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: colors.text }}
        >
          {meta?.label ?? step.type}
        </span>
      </div>
      <div
        className="font-semibold text-sm mb-1"
        style={{ color: isDark ? '#ffffff' : '#0f172a' }}
      >
        {index + 1}. {step.title || '(Untitled)'}
      </div>
      {step.prompt && (
        <div
          className="text-xs line-clamp-3 font-mono rounded p-1.5 mt-1"
          style={{
            background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
            color: isDark ? '#94a3b8' : '#64748b',
          }}
        >
          {step.prompt.slice(0, 150)}
          {step.prompt.length > 150 ? '\u2026' : ''}
        </div>
      )}
      {step.references && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {step.references.split(',').map((ref, i) => (
            <span
              key={i}
              className="text-[10px] rounded px-1.5 py-0.5"
              style={{
                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
                color: isDark ? '#94a3b8' : '#64748b',
                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
              }}
            >
              @{ref.trim()}
            </span>
          ))}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-400 dark:!bg-slate-500 !w-3 !h-3"
      />
    </div>
  );
}

/* ── Custom Group Node ── */
function GroupNode({
  data,
}: {
  data: { group: Group; index: number; childCount: number; isDark: boolean };
}) {
  const { group, index, childCount, isDark } = data;
  const groupStyle = isDark ? GROUP_STYLE_DARK : GROUP_STYLE_LIGHT;
  return (
    <div
      className="rounded-xl shadow-lg px-4 py-3 min-w-[260px] max-w-[320px] border-2 border-dashed"
      style={{ background: groupStyle.bg, borderColor: groupStyle.border }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-400 !w-3 !h-3"
      />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{'\uD83D\uDD04'}</span>
        <span
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: groupStyle.text }}
        >
          Reasoning Group
        </span>
      </div>
      <div
        className="font-semibold text-sm mb-1"
        style={{ color: isDark ? '#ffffff' : '#0f172a' }}
      >
        {index + 1}. {group.title || '(Untitled Group)'}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span
          className="text-[10px] rounded px-2 py-0.5 font-medium"
          style={{
            background: isDark ? 'rgba(88,28,135,0.5)' : 'rgba(139,92,246,0.15)',
            color: isDark ? '#d8b4fe' : '#7c3aed',
            border: `1px solid ${isDark ? '#6b21a8' : '#c4b5fd'}`,
          }}
        >
          {group.runCondition}
        </span>
        <span style={{ color: isDark ? '#94a3b8' : '#64748b' }} className="text-[10px]">
          {childCount} steps inside
        </span>
      </div>
      {group.reasoningInstructions && (
        <div
          className="text-xs font-mono rounded p-1.5 mt-1.5 line-clamp-2"
          style={{
            background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
            color: isDark ? '#94a3b8' : '#64748b',
          }}
        >
          {group.reasoningInstructions.slice(0, 120)}
          {group.reasoningInstructions.length > 120 ? '\u2026' : ''}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-400 !w-3 !h-3"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  stepNode: StepNode,
  groupNode: GroupNode,
} as unknown as NodeTypes;

/* ── Build nodes & edges from Flow ── */
function buildGraph(flow: Flow, isDark: boolean) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const stepTitleToId = new Map<string, string>();
  const groupStyle = isDark ? GROUP_STYLE_DARK : GROUP_STYLE_LIGHT;

  let y = 0;
  const Y_GAP = 160;
  const Y_GROUP_CHILD_GAP = 140;
  const GROUP_CHILD_X_OFFSET = 40;
  let globalIndex = 0;

  // First pass: create nodes and map titles to IDs
  for (const item of flow.items) {
    if (item.isGroup) {
      const groupId = `group-${item.id}`;
      nodes.push({
        id: groupId,
        type: 'groupNode',
        position: { x: 0, y },
        data: { group: item, index: globalIndex, childCount: item.steps.length, isDark },
      });
      stepTitleToId.set(item.title.toLowerCase(), groupId);

      let prevChildId = groupId;
      let childY = y + Y_GAP;

      for (const step of item.steps) {
        const stepId = `step-${step.id}`;
        nodes.push({
          id: stepId,
          type: 'stepNode',
          position: { x: GROUP_CHILD_X_OFFSET, y: childY },
          data: { step, index: globalIndex, isDark },
        });
        stepTitleToId.set(step.title.toLowerCase(), stepId);

        edges.push({
          id: `e-${prevChildId}-${stepId}`,
          source: prevChildId,
          target: stepId,
          animated: true,
          style: { stroke: groupStyle.border, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: groupStyle.border },
        });
        prevChildId = stepId;
        childY += Y_GROUP_CHILD_GAP;
        globalIndex++;
      }
      y = childY + Y_GAP / 2;
      globalIndex++;
    } else {
      const stepId = `step-${item.id}`;
      nodes.push({
        id: stepId,
        type: 'stepNode',
        position: { x: 0, y },
        data: { step: item, index: globalIndex, isDark },
      });
      stepTitleToId.set(item.title.toLowerCase(), stepId);
      y += Y_GAP;
      globalIndex++;
    }
  }

  // Second pass: sequential edges between top-level items
  const seqStroke = isDark ? '#64748b' : '#94a3b8';
  const topLevel = flow.items.map((item) =>
    item.isGroup ? `group-${item.id}` : `step-${item.id}`
  );
  for (let i = 0; i < topLevel.length - 1; i++) {
    const src = topLevel[i]!;
    const tgt = topLevel[i + 1]!;
    // For groups, connect from last child step
    const srcItem = flow.items[i]!;
    let actualSrc = src;
    if (srcItem.isGroup && srcItem.steps.length > 0) {
      actualSrc = `step-${srcItem.steps[srcItem.steps.length - 1]!.id}`;
    }
    edges.push({
      id: `seq-${i}`,
      source: actualSrc,
      target: tgt,
      style: { stroke: seqStroke, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: seqStroke },
    });
  }

  // Third pass: @reference edges
  const refColor = isDark ? '#f59e0b' : '#d97706';
  const allStepsList = allSteps(flow.items);
  for (const step of allStepsList) {
    if (!step.references) continue;
    const stepId = `step-${step.id}`;
    for (const ref of step.references.split(',')) {
      const refName = ref.trim().replace(/^@/, '').toLowerCase();
      const targetId = stepTitleToId.get(refName);
      if (targetId && targetId !== stepId) {
        edges.push({
          id: `ref-${stepId}-${targetId}`,
          source: targetId,
          target: stepId,
          animated: true,
          style: { stroke: refColor, strokeWidth: 2, strokeDasharray: '5 5' },
          markerEnd: { type: MarkerType.ArrowClosed, color: refColor },
          label: '@ref',
        });
      }
    }
  }

  return { nodes, edges };
}

/* ── Detail sidebar ── */
function DetailPanel({ step, onClose }: { step: Step | null; onClose: () => void }) {
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';
  if (!step) return null;
  const meta = STEP_TYPES.find((x) => x.value === step.type);
  const palette = isDark ? TYPE_COLORS_DARK : TYPE_COLORS_LIGHT;
  const defaultColor = isDark ? DEFAULT_COLOR_DARK : DEFAULT_COLOR_LIGHT;
  const colors = palette[step.type] ?? defaultColor;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white dark:bg-midnight-800 shadow-2xl border-l border-slate-200 dark:border-midnight-700 z-20 overflow-y-auto">
      <div className="sticky top-0 bg-white dark:bg-midnight-800 border-b border-slate-200 dark:border-midnight-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta?.icon}</span>
          <span className="font-semibold text-sm text-slate-900 dark:text-white">
            {step.title || '(Untitled)'}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-lg p-1"
        >
          {'\u2715'}
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: colors.text }}
          >
            {meta?.label}
          </span>
        </div>
        {step.type === 'chat_agent' && step.agentName && (
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">
              Chat Agent
            </div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {step.agentName}
            </div>
          </div>
        )}
        {step.type === 'general_knowledge' && (
          <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="text-slate-400 dark:text-slate-500">Source:</span>{' '}
              {step.source}
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Output:</span>{' '}
              {step.outputPref}
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Creativity:</span>{' '}
              {step.creativityLevel}
              /10
            </div>
          </div>
        )}
        {step.prompt && (
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Prompt</div>
            <pre className="text-sm font-mono bg-slate-50 dark:bg-[#0d1117] rounded-lg p-3 whitespace-pre-wrap border border-slate-200 dark:border-midnight-700 max-h-96 overflow-y-auto text-slate-700 dark:text-slate-300">
              {step.prompt}
            </pre>
          </div>
        )}
        {step.references && (
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">
              References
            </div>
            <div className="flex flex-wrap gap-1">
              {step.references.split(',').map((r, i) => (
                <span
                  key={i}
                  className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded px-2 py-0.5 border border-amber-200 dark:border-amber-800"
                >
                  @{r.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
        {step.type === 'user_input_text' && (
          <>
            {step.placeholder && (
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500 text-xs">
                  Placeholder:
                </span>{' '}
                {step.placeholder}
              </div>
            )}
            {step.defaultValue && (
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500 text-xs">
                  Default:
                </span>{' '}
                {step.defaultValue}
              </div>
            )}
          </>
        )}
        {step.config && (
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Config</div>
            <pre className="text-xs font-mono bg-slate-50 dark:bg-[#0d1117] rounded p-2 border border-slate-200 dark:border-midnight-700 text-slate-700 dark:text-slate-300">
              {step.config}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Legend ── */
function Legend() {
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';
  const palette = isDark ? TYPE_COLORS_DARK : TYPE_COLORS_LIGHT;
  const defaultColor = isDark ? DEFAULT_COLOR_DARK : DEFAULT_COLOR_LIGHT;
  const groupStyle = isDark ? GROUP_STYLE_DARK : GROUP_STYLE_LIGHT;
  const refColor = isDark ? '#f59e0b' : '#d97706';

  const items = STEP_TYPES.map((t) => ({
    icon: t.icon,
    label: t.label,
    color: (palette[t.value] ?? defaultColor).border,
  }));
  return (
    <div className="bg-white/90 dark:bg-midnight-800/90 backdrop-blur rounded-lg shadow-lg p-3 text-xs space-y-1.5 max-h-80 overflow-y-auto border border-slate-200 dark:border-midnight-700">
      <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Legend</div>
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400"
        >
          <div
            className="w-3 h-3 rounded-sm border-2"
            style={{ borderColor: it.color, background: it.color + '33' }}
          />
          <span>
            {it.icon} {it.label}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200 dark:border-midnight-700 text-slate-500 dark:text-slate-400">
        <div
          className="w-3 h-3 rounded-sm border-2 border-dashed"
          style={{ borderColor: groupStyle.border, background: groupStyle.bg }}
        />
        <span>{'\uD83D\uDD04'} Reasoning Group</span>
      </div>
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <div
          className="w-6 h-0 border-t-2 border-dashed"
          style={{ borderColor: refColor }}
        />
        <span>@reference link</span>
      </div>
    </div>
  );
}

/* ── Main FlowGraph component ── */
interface FlowGraphProps {
  flow: Flow;
  onBack: () => void;
}

export default function FlowGraph({ flow, onBack }: FlowGraphProps) {
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(flow, isDark),
    [flow, isDark]
  );
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'stepNode') {
      setSelectedStep((node.data as { step: Step }).step);
    }
  }, []);

  const steps = allSteps(flow.items);
  const groupStyle = isDark ? GROUP_STYLE_DARK : GROUP_STYLE_LIGHT;

  if (flow.items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-xl shadow-sm p-4 flex items-center gap-3">
          <span className="text-2xl">{'\uD83D\uDD00'}</span>
          <span className="font-semibold text-sm text-slate-900 dark:text-white">
            Flow Graph
          </span>
          <div className="flex-1" />
          <button
            onClick={onBack}
            className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            &larr; Back
          </button>
        </div>
        <div className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">{'\uD83D\uDCCB'}</div>
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            No flow loaded
          </div>
          <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Parse a flow first, then come back here to see the interactive graph.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{'\uD83D\uDD00'}</span>
          <div>
            <div className="font-semibold text-sm text-slate-900 dark:text-white">
              {flow.title || '(Untitled)'}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Interactive flow graph &middot; {steps.length} steps &middot; Click any node
              for details
            </div>
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={onBack}
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          &larr; Back
        </button>
      </div>

      <div
        className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-xl shadow-sm overflow-hidden relative"
        style={{ height: '70vh' }}
      >
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={isDark ? '#334155' : '#cbd5e1'} gap={20} />
          <Controls position="bottom-left" />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'groupNode') return groupStyle.border;
              const step = (node.data as { step: Step }).step;
              const palette = isDark ? TYPE_COLORS_DARK : TYPE_COLORS_LIGHT;
              const defaultColor = isDark ? DEFAULT_COLOR_DARK : DEFAULT_COLOR_LIGHT;
              return (palette[step.type] ?? defaultColor).border;
            }}
            maskColor={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'}
            position="bottom-right"
            style={{ background: isDark ? '#0f172a' : '#f1f5f9' }}
          />
          <Panel position="top-left">
            <Legend />
          </Panel>
        </ReactFlow>
        <DetailPanel step={selectedStep} onClose={() => setSelectedStep(null)} />
      </div>
    </div>
  );
}
