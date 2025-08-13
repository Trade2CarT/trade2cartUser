import React from 'react';

const PoliciesAndTerms = () => {
    // Finalized and styled content for the Privacy Policy
    const privacyContent = `
        <div class="prose max-w-none text-gray-700">
            <div class="text-2xl font-bold text-gray-900 mb-1">🔒 Privacy Policy</div>
            <p class="text-xs text-gray-500">Effective Date: 23-06-2025 | Last Updated: 23-08-2025</p>
            <p class="mt-4">We value your privacy. This policy explains how we handle your data:</p>
            
            <h4 class="font-semibold text-gray-800 mt-6">Information We Collect</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>Name, contact details, location, and booking information.</li>
                <li>Data collected when you use our app or website.</li>
            </ul>

            <h4 class="font-semibold text-gray-800 mt-6">How We Use Your Data</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>To process bookings and assign vendors.</li>
                <li>To send notifications and updates about your orders.</li>
                <li>To improve our services and prevent misuse.</li>
            </ul>

            <h4 class="font-semibold text-gray-800 mt-6">Data Sharing</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>We share your details only with assigned vendors to complete your bookings.</li>
                <li>We do not sell your personal data to third parties.</li>
            </ul>

            <h4 class="font-semibold text-gray-800 mt-6">Data Retention & Your Rights</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>We keep your booking history for legal and operational purposes.</li>
                <li>You can request access to your data or ask for deletion by emailing <a href="mailto:trade@trade2cart.in" class="text-blue-600 hover:underline">trade@trade2cart.in</a>.</li>
            </ul>

            <h4 class="font-semibold text-gray-800 mt-6">Security</h4>
            <p>We use reasonable security measures to protect your data but cannot guarantee 100% security.</p>
        </div>
    `;

    // Finalized and styled content for the Terms & Conditions
    const termsContent = `
        <div class="prose max-w-none text-gray-700">
            <div class="text-2xl font-bold text-gray-900 mb-1">📜 Terms & Conditions</div>
            <p class="text-xs text-gray-500">Effective Date: 23-06-2025 | Last Updated: 23-08-2025</p>
            <p class="mt-4">Welcome to Trade2Cart! By using our services, you agree to the following terms:</p>
            
            <h4 class="font-semibold text-gray-800 mt-6">Platform Role</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>Trade2Cart is a mediator between users and vendors.</li>
                <li>We do not buy, sell, or collect scrap directly.</li>
                <li>All transactions, including payments, happen directly between the user and the vendor.</li>
            </ul>

            <h4 class="font-semibold text-gray-800 mt-6">User Responsibilities</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>Provide accurate booking and location details.</li>
                <li>Be available at the scheduled pickup time.</li>
                <li>Cancelations are not available once the booking is confirmed.</li>
            </ul>

            <h4 class="font-semibold text-gray-800 mt-6">Vendor Responsibilities</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>Vendors must pay users directly at pickup.</li>
                <li>Trade2Cart is not liable for delayed or failed payments from vendors.</li>
            </ul>

            <h4 class="font-semibold text-gray-800 mt-6">Fees & Disputes</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>Users pay a platform fee for scheduling (if applicable).</li>
                <li>Vendors may be charged service/commission fees after the free period.</li>
                <li>Any disputes must be resolved directly between the user and the vendor. Trade2Cart will not be responsible for lost payments or disagreements.</li>
            </ul>

             <h4 class="font-semibold text-gray-800 mt-6">Contact & Service Limitations</h4>
            <ul class="list-disc list-inside space-y-1">
                <li>Trade2Cart reserves the right to refuse service for policy violations.</li>
                <li>Contact us at <a href="mailto:trade@trade2cart.in" class="text-blue-600 hover:underline">trade@trade2cart.in</a> or visit our website <a href="https://trade2cart.in" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">trade2cart.in</a>.</li>
            </ul>
        </div>
    `;

    return (
        <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm">
            <div className="bg-gray-50 p-6 rounded-lg border">
                <div dangerouslySetInnerHTML={{ __html: privacyContent }} />
            </div>

            <div className="my-8 border-t border-gray-200"></div>

            <div className="bg-gray-50 p-6 rounded-lg border">
                <div dangerouslySetInnerHTML={{ __html: termsContent }} />
            </div>
        </div>
    );
};

export default PoliciesAndTerms;