<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'member_code',
        'name',
        'phone',
        'notes',
        'status',
    ];

    public function networkAccounts(): HasMany
    {
        return $this->hasMany(NetworkAccount::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function macObservations(): HasMany
    {
        return $this->hasMany(MacObservation::class);
    }
}
