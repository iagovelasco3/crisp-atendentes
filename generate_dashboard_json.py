import json
import os
from datetime import datetime, timezone

SNAPSHOT_PATH = "/Users/iagovelasco/.openclaw/workspace-crisp-analyzer-agent/reports/daily/support_snapshot.json" # Caminho completo para o snapshot
DASHBOARD_DATA_PATH = "dashboard_data.json" # No diretório do repositório

def load_json(path, default):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return default

def save_json_safe(path, data):
    tmp_path = path + ".tmp"
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp_path, path)

def generate_dashboard_data():
    snapshot = load_json(SNAPSHOT_PATH, {})

    # Se o snapshot estiver vazio ou inconsistente, criar dados dummy para o dashboard
    if not snapshot or not snapshot.get("data_consistente", False) or snapshot.get("total_conversas_hoje", 0) == 0:
        print("AVISO: Snapshot do Crisp Analyzer vazio ou inconsistente. Gerando dados de demonstração para o dashboard.")
        dashboard_data = {
            "gerado_em": datetime.now(timezone.utc).isoformat(),
            "visao_geral": {
                "total_conversas_hoje": 0,
                "tma_medio_minutos": 0,
                "frt_medio_minutos": 0,
                "score_medio_geral": 0
            },
            "ranking_atendentes": [
                {"id": "dummy1", "nome": "Atendente Demo 1", "score_geral": 90, "tma_minutos": 25, "frt_minutos": 5, "tickets_atendidos": 50, "sentimento_negativo_percent": 2, "elogios_recebidos": 3, "status_risco": False, "observacoes": "Dados de demonstração. Aguardando dados reais do Crisp Analyzer."} 
            ],
            "melhores_atendimentos_recentes": [],
            "elogios_recentes": [],
            "pontos_de_crescimento_gerais": ["Aguardando dados reais do Crisp Analyzer."]
        }
    else:
        # Estrutura do dashboard_data.json conforme o prompt
        dashboard_data = {
            "gerado_em": datetime.now(timezone.utc).isoformat(),
            "visao_geral": {
                "total_conversas_hoje": snapshot.get("total_conversas_hoje", 0),
                "tma_medio_minutos": snapshot.get("visao_geral", {}).get("tma_medio_minutos", 0),
                "frt_medio_minutos": snapshot.get("visao_geral", {}).get("frt_medio_minutos", 0),
                "score_medio_geral": snapshot.get("visao_geral", {}).get("score_medio_geral", 0)
            },
            "ranking_atendentes": [],
            "melhores_atendimentos_recentes": snapshot.get("melhores_atendimentos_recentes", []),
            "elogios_recentes": snapshot.get("elogios_recentes", []),
            "pontos_de_crescimento_gerais": snapshot.get("oportunidades_de_evolucao", []) 
        }

        # Popular ranking_atendentes a partir do snapshot
        for agent in snapshot.get("ranking_atendentes", []):
            dashboard_data["ranking_atendentes"].append({
                "id": agent.get("id"),
                "nome": agent.get("nome"),
                "score_geral": agent.get("score_geral"),
                "tma_minutos": agent.get("tma_minutos"),
                "frt_minutos": agent.get("frt_minutos"),
                "tickets_atendidos": agent.get("tickets_atendidos"),
                "sentimento_negativo_percent": agent.get("sentimento_negativo_percent"),
                "elogios_recebidos": agent.get("elogios_recebidos", 0),
                "status_risco": agent.get("status_risco"),
                "observacoes": agent.get("observacoes", "")
            })
    
    save_json_safe(DASHBOARD_DATA_PATH, dashboard_data)
    print(f"Dashboard data JSON gerado em {DASHBOARD_DATA_PATH}")

if __name__ == "__main__":
    generate_dashboard_data()
