<?php

use App\Models\Contact;
use App\Mail\ContactReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

it('stores a contact submission', function () {
    Mail::fake();
    postJson('/api/contact', [
        'name' => 'Sara', 'email' => 'sara@example.com',
        'phone' => '+963999', 'message' => 'Hello there',
    ])->assertCreated();
    expect(Contact::where('email', 'sara@example.com')->exists())->toBeTrue();
});

it('validates required fields', function () {
    postJson('/api/contact', ['name' => ''])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'message']);
});

it('sends mail when enabled', function () {
    config(['mail.contact_enabled' => true]);
    Mail::fake();
    postJson('/api/contact', ['name' => 'A', 'email' => 'a@b.com', 'message' => 'Hi there now']);
    Mail::assertSent(ContactReceived::class);
});
