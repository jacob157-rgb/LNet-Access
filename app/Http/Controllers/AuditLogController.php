<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AuditLog::with(['actor', 'routerConnection'])->latest('created_at');

        if ($action = $request->get('action')) {
            $query->where('action', $action);
        }

        if ($entity = $request->get('entity_type')) {
            $query->where('entity_type', $entity);
        }

        $logs = $query->paginate(30)->withQueryString();

        return Inertia::render('audit/index', [
            'logs' => $logs,
            'filters' => $request->only(['action', 'entity_type']),
        ]);
    }
}
