import React from 'react';

const PoliciesAndTerms = () => {
    const termsContent = `
        <div class="prose max-w-none">
            <h3>📜 Trade2Cart – Terms & Conditions</h3>
            <p><strong>Effective Date:</strong> August 10, 2025</p>
            <p>Welcome to Trade2Cart. These Terms and Conditions (“Terms”) govern your use of our platform. By using Trade2Cart, you agree to these Terms.</p>
            <h4>1. Platform Role</h4>
            <ul>
                <li>Trade2Cart acts as a mediator between users and scrap vendors.</li>
                <li>We are not responsible for vendor behavior or payments.</li>
            </ul>
            <h4>2. User Obligations</h4>
            <ul>
                <li>Provide accurate pickup information.</li>
                <li>Be available at the scheduled time.</li>
                <li>Cancellation is not available once a pickup is scheduled.</li>
            </ul>
        </div>
    `;

    const privacyContent = `
        <div class="prose max-w-none">
            <h3>🔒 Trade2Cart – Privacy Policy</h3>
            <p><strong>Effective Date:</strong> August 10, 2025</p>
            <p>Your privacy is important to us. This policy explains how we collect, use, and protect your data.</p>
            <h4>1. Data We Collect</h4>
            <ul>
                <li>Name, phone number, address</li>
                <li>Pickup requests and history</li>
            </ul>
            <h4>2. How We Use Your Data</h4>
            <ul>
                <li>To schedule and manage pickups.</li>
                <li>To communicate with vendors and improve our platform.</li>
            </ul>
        </div>
    `;

    return (
        <div className="space-y-6">
            <div dangerouslySetInnerHTML={{ __html: privacyContent }} />
            <hr />
            <div dangerouslySetInnerHTML={{ __html: termsContent }} />
        </div>
    );
};

export default PoliciesAndTerms;