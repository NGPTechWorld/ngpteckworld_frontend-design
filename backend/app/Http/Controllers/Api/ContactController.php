<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Mail\ContactReceived;
use App\Models\Contact;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request)
    {
        $contact = Contact::create($request->validated());

        if (config('mail.contact_enabled')) {
            Mail::to(config('mail.contact_notify'))->send(new ContactReceived($contact));
        }

        return response()->json(['message' => 'received'], 201);
    }
}
