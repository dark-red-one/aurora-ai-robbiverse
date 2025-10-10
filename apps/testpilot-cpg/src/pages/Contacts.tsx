import { Users, Building2, Mail, Phone } from 'lucide-react'

export default function Contacts() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-testpilot-dark">CRM Contacts</h1>
        <p className="text-gray-600 mt-1">Manage contacts and companies with AI-powered insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-testpilot-dark">127</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Companies</p>
              <p className="text-2xl font-bold text-testpilot-dark">40</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recent Contacts</p>
              <p className="text-2xl font-bold text-testpilot-dark">18</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <div className="inline-block p-4 bg-testpilot-orange/10 rounded-full mb-4">
              <Users className="w-8 h-8 text-testpilot-orange" />
            </div>
            <h2 className="text-2xl font-bold text-testpilot-dark mb-2">
              Smart CRM Coming Soon
            </h2>
            <p className="text-gray-600">
              Full contact and company management with AI-powered enrichment
            </p>
          </div>

          <div className="space-y-3">
            <CRMFeature
              icon={<Users className="w-5 h-5" />}
              title="Contact Management"
              description="Store all contact details, communication history, and relationships"
            />
            <CRMFeature
              icon={<Building2 className="w-5 h-5" />}
              title="Company Profiles"
              description="Track company details, decision makers, and deal history"
            />
            <CRMFeature
              icon={<Mail className="w-5 h-5" />}
              title="Email Integration"
              description="Automatically log emails and extract insights from conversations"
            />
            <CRMFeature
              icon={<Phone className="w-5 h-5" />}
              title="Activity Timeline"
              description="See every interaction: emails, calls, meetings, notes"
            />
          </div>

          <div className="text-center pt-4">
            <span className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
              Phase 3 - Building in 2-4 weeks
            </span>
          </div>
        </div>
      </div>

      {/* Mock Contact List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-testpilot-dark">Preview: Recent Contacts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mockContacts.map((contact) => (
            <div key={contact.name} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-testpilot-orange/20 flex items-center justify-center">
                    <span className="text-testpilot-orange font-semibold">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-testpilot-dark">{contact.name}</p>
                    <p className="text-sm text-gray-600">{contact.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{contact.role}</p>
                  <p className="text-xs text-gray-400">{contact.lastContact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CRMFeature({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 p-2 bg-testpilot-orange/10 text-testpilot-orange rounded-lg">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-testpilot-dark">{title}</h4>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

const mockContacts = [
  { name: 'John Smith', company: 'Simply Good Foods', role: 'VP of Sales', lastContact: '2 days ago' },
  { name: 'Sarah Johnson', company: 'Test INC', role: 'Director', lastContact: '5 days ago' },
  { name: 'Mike Davis', company: 'CPG Partners', role: 'CEO', lastContact: '1 week ago' },
]

