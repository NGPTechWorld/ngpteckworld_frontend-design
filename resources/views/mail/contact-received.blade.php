<h2>New contact message</h2>
<p><strong>Name:</strong> {{ $contact->name }}</p>
<p><strong>Email:</strong> {{ $contact->email }}</p>
<p><strong>Phone:</strong> {{ $contact->phone ?: '-' }}</p>
<p><strong>Message:</strong></p>
<p>{{ $contact->message }}</p>
