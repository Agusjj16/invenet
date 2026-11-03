<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EstadoActivo;

class EstadoActivoController extends Controller
{
    public function index()
    {
        return response()->json(
            EstadoActivo::orderBy('id')->get()
        );
    }

    public function show(EstadoActivo $estadoActivo)
    {
        return response()->json($estadoActivo);
    }
}