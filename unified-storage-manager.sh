#!/bin/bash
# Aurora AI Empire - Unified Storage Manager
# Manages 178TB across distributed nodes using rsync

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║      AURORA UNIFIED STORAGE - 178TB MANAGEMENT SYSTEM        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Storage nodes
FLUENTI_HOST="103.196.86.56"
FLUENTI_PORT="19777"
COLLAB_HOST="213.181.111.2"
COLLAB_PORT="43540"

case "$1" in
    push-model)
        # Push a model to Fluenti's massive storage
        MODEL=$2
        if [ -z "$MODEL" ]; then
            echo "Usage: $0 push-model <model-path>"
            exit 1
        fi
        echo "📤 Pushing model to Fluenti (178TB storage)..."
        rsync -avz --progress "$MODEL" -e "ssh -p $FLUENTI_PORT" root@$FLUENTI_HOST:/workspace/models/
        echo "✅ Model stored on Fluenti!"
        ;;
        
    pull-model)
        # Pull a model from Fluenti
        MODEL=$2
        if [ -z "$MODEL" ]; then
            echo "Available models on Fluenti:"
            ssh -p $FLUENTI_PORT root@$FLUENTI_HOST "ls -lah /workspace/models/ 2>/dev/null || echo 'No models yet'"
            exit 0
        fi
        echo "📥 Pulling model from Fluenti..."
        rsync -avz --progress -e "ssh -p $FLUENTI_PORT" root@$FLUENTI_HOST:/workspace/models/"$MODEL" /workspace/models/
        echo "✅ Model retrieved!"
        ;;
        
    push-dataset)
        # Push dataset to Fluenti
        DATASET=$2
        if [ -z "$DATASET" ]; then
            echo "Usage: $0 push-dataset <dataset-path>"
            exit 1
        fi
        echo "📤 Pushing dataset to Fluenti (178TB storage)..."
        rsync -avz --progress "$DATASET" -e "ssh -p $FLUENTI_PORT" root@$FLUENTI_HOST:/workspace/datasets/
        echo "✅ Dataset stored on Fluenti!"
        ;;
        
    sync-all)
        # Sync current Aurora to all nodes
        echo "🔄 Syncing Aurora to all nodes..."
        echo ""
        echo "→ Syncing to Collaboration..."
        rsync -avz --delete /workspace/aurora/ -e "ssh -p $COLLAB_PORT" root@$COLLAB_HOST:/workspace/aurora/
        echo "✅ Collaboration synced"
        echo ""
        echo "→ Syncing to Fluenti..."
        rsync -avz --delete /workspace/aurora/ -e "ssh -p $FLUENTI_PORT" root@$FLUENTI_HOST:/workspace/aurora/
        echo "✅ Fluenti synced"
        echo ""
        echo "🎉 All nodes synchronized!"
        ;;
        
    status)
        echo "📊 UNIFIED STORAGE STATUS"
        echo "═══════════════════════════════════════════"
        echo ""
        echo "🔥 AURORA (Current Node):"
        df -h /workspace | tail -1 | awk '{print "   Available: "$4" of "$2}'
        echo ""
        echo "🤝 COLLABORATION Node:"
        ssh -p $COLLAB_PORT root@$COLLAB_HOST "df -h /workspace | tail -1" 2>/dev/null | awk '{print "   Available: "$4" of "$2}'
        echo ""
        echo "💾 FLUENTI Node (MASSIVE):"
        ssh -p $FLUENTI_PORT root@$FLUENTI_HOST "df -h /workspace | tail -1" 2>/dev/null | awk '{print "   Available: "$4" of "$2" (178TB free!)"}'
        echo ""
        echo "📦 Total Models Stored:"
        ssh -p $FLUENTI_PORT root@$FLUENTI_HOST "ls /workspace/models 2>/dev/null | wc -l || echo 0" 2>/dev/null | xargs echo "   "
        echo ""
        echo "📚 Total Datasets:"
        ssh -p $FLUENTI_PORT root@$FLUENTI_HOST "ls /workspace/datasets 2>/dev/null | wc -l || echo 0" 2>/dev/null | xargs echo "   "
        ;;
        
    list-models)
        echo "🤖 Models on Fluenti (178TB storage):"
        ssh -p $FLUENTI_PORT root@$FLUENTI_HOST "ls -lah /workspace/models/ 2>/dev/null || echo '   No models stored yet'"
        ;;
        
    list-datasets)
        echo "📚 Datasets on Fluenti (178TB storage):"
        ssh -p $FLUENTI_PORT root@$FLUENTI_HOST "ls -lah /workspace/datasets/ 2>/dev/null || echo '   No datasets stored yet'"
        ;;
        
    backup)
        # Backup important data to Fluenti
        echo "💾 Backing up to Fluenti's 178TB storage..."
        BACKUP_NAME="aurora-backup-$(date +%Y%m%d-%H%M%S)"
        ssh -p $FLUENTI_PORT root@$FLUENTI_HOST "mkdir -p /workspace/backups"
        rsync -avz --progress /workspace/aurora/ -e "ssh -p $FLUENTI_PORT" root@$FLUENTI_HOST:/workspace/backups/$BACKUP_NAME/
        echo "✅ Backup complete: $BACKUP_NAME"
        ;;
        
    *)
        echo "Usage: $0 {command} [args]"
        echo ""
        echo "Commands:"
        echo "  status          - Show storage status across all nodes"
        echo "  sync-all        - Sync Aurora to all nodes"
        echo "  push-model      - Store model on Fluenti (178TB)"
        echo "  pull-model      - Retrieve model from Fluenti"
        echo "  push-dataset    - Store dataset on Fluenti"
        echo "  list-models     - List models on Fluenti"
        echo "  list-datasets   - List datasets on Fluenti"
        echo "  backup          - Backup to Fluenti"
        echo ""
        echo "Examples:"
        echo "  $0 push-model /path/to/llama-70b.bin"
        echo "  $0 pull-model llama-70b.bin"
        echo "  $0 push-dataset /path/to/training-data/"
        echo "  $0 backup"
        ;;
esac
