<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function visitor(Request $request): string
    {
        return hash('sha256', $request->session()->getId());
    }
}
