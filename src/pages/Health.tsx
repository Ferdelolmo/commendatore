import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type HealthStatus = 'checking' | 'ok' | 'error';

interface HealthData {
  status: HealthStatus;
  timestamp: string;
  supabase_url: string;
  latency_ms: number | null;
  strategy?: string;
  error?: string;
}

const Health = () => {
  const [health, setHealth] = useState<HealthData>({
    status: 'checking',
    timestamp: new Date().toISOString(),
    supabase_url: import.meta.env.VITE_SUPABASE_URL ?? 'unknown',
    latency_ms: null,
  });

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const checkHealth = async () => {
      const start = Date.now();

      // ── Strategy 1: call get_health_ping() RPC (works after SQL is deployed) ──
      try {
        const { error } = await supabase.rpc('get_health_ping').maybeSingle();
        if (!error) {
          setHealth({
            status: 'ok',
            timestamp: new Date().toISOString(),
            supabase_url: supabaseUrl,
            latency_ms: Date.now() - start,
            strategy: 'rpc',
          });
          return;
        }
        // PGRST202 = function not found → fall through to strategy 2
        if (error.code !== 'PGRST202') throw error;
      } catch (_) {
        // continue to fallback
      }

      // ── Strategy 2: GET the PostgREST root — always returns 200 when DB is alive ──
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });
        if (res.ok || res.status === 200) {
          setHealth({
            status: 'ok',
            timestamp: new Date().toISOString(),
            supabase_url: supabaseUrl,
            latency_ms: Date.now() - start,
            strategy: 'rest_ping',
          });
          return;
        }
        throw new Error(`REST ping returned HTTP ${res.status}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : JSON.stringify(err);
        setHealth({
          status: 'error',
          timestamp: new Date().toISOString(),
          supabase_url: supabaseUrl,
          latency_ms: Date.now() - start,
          error: message,
        });
      }
    };

    checkHealth();
  }, []);

  const statusColors: Record<HealthStatus, { bg: string; accent: string; dot: string }> = {
    checking: { bg: '#0f172a', accent: '#f59e0b', dot: '#fbbf24' },
    ok: { bg: '#0f172a', accent: '#10b981', dot: '#34d399' },
    error: { bg: '#0f172a', accent: '#ef4444', dot: '#f87171' },
  };

  const colors = statusColors[health.status];

  return (
    <div
      id="health-page"
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        padding: '2rem',
      }}
    >
      {/* Animated background grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          border: `1px solid ${colors.accent}33`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: `0 0 40px ${colors.accent}22, 0 0 80px ${colors.accent}11`,
        }}
      >
        {/* Header bar */}
        <div
          style={{
            backgroundColor: `${colors.accent}11`,
            borderBottom: `1px solid ${colors.accent}33`,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: colors.dot,
              boxShadow: `0 0 8px ${colors.dot}`,
              animation: health.status === 'checking' ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          <span style={{ color: colors.accent, fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>
            SYSTEM HEALTH CHECK
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '11px',
              color: colors.accent + '99',
              letterSpacing: '0.03em',
            }}
          >
            commendatore.site
          </span>
        </div>

        {/* JSON body */}
        <div
          style={{
            backgroundColor: '#0a0f1e',
            padding: '28px 24px',
          }}
        >
          <pre
            id="health-json"
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
            }}
          >
            <span style={{ color: '#64748b' }}>{'{\n'}</span>
            {renderField('status', health.status, colors.accent)}
            {renderField('timestamp', health.timestamp, '#94a3b8')}
            {renderField('supabase_url', health.supabase_url, '#94a3b8')}
            {health.latency_ms !== null && renderField('latency_ms', health.latency_ms, '#94a3b8')}
            {health.strategy && renderField('strategy', health.strategy, '#7dd3fc')}
            {health.error && renderField('error', health.error, '#f87171')}
            <span style={{ color: '#64748b' }}>{'}'}</span>
          </pre>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: `${colors.accent}08`,
            borderTop: `1px solid ${colors.accent}22`,
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.04em' }}>
            HTTP 200 · Supabase keep-alive endpoint
          </span>
          {health.status === 'ok' && (
            <span style={{ fontSize: '11px', color: colors.dot, fontWeight: 600, letterSpacing: '0.04em' }}>
              ✓ DB ACTIVE
            </span>
          )}
          {health.status === 'error' && (
            <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600, letterSpacing: '0.04em' }}>
              ✗ DB UNREACHABLE
            </span>
          )}
          {health.status === 'checking' && (
            <span style={{ fontSize: '11px', color: colors.dot, letterSpacing: '0.04em', opacity: 0.7 }}>
              ⟳ PINGING…
            </span>
          )}
        </div>
      </div>

      <p
        style={{
          marginTop: '24px',
          fontSize: '12px',
          color: '#334155',
          textAlign: 'center',
          letterSpacing: '0.04em',
        }}
      >
        Synthetic monitoring endpoint · Keeps Supabase free-tier DB from pausing
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

function renderField(key: string, value: string | number, valueColor: string) {
  return (
    <span key={key}>
      <span style={{ color: '#7c3aed' }}>  "{key}"</span>
      <span style={{ color: '#64748b' }}>: </span>
      <span style={{ color: valueColor }}>
        {typeof value === 'number' ? value : `"${value}"`}
      </span>
      <span style={{ color: '#64748b' }}>,{'\n'}</span>
    </span>
  );
}

export default Health;
