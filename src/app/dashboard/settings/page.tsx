import { PasswordForm, ProfileForm } from '@/app/(store)/account/settings/settings-forms'
import { PageHeader, Panel } from '@/components/dash/ui'
import { can } from '@/lib/roles'
import { requireUser } from '@/lib/server/auth'
import { getSetting } from '@/lib/server/settings'
import { MaintenanceForm, StoreInfoForm } from './store-forms'

export const metadata = { title: 'Settings' }

export default async function Settings() {
  const me = await requireUser()
  const owner = can(me.role, 'settings.manage')
  const [maintenance, store] = owner ? await Promise.all([getSetting('maintenance'), getSetting('store')]) : [null, null]
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      {owner && maintenance && store && (
        <>
          <Panel title="Store availability"><MaintenanceForm enabled={maintenance.enabled} message={maintenance.message} /></Panel>
          <Panel title="Store details" description="Shown in the footer, on the atelier page and in customer emails."><StoreInfoForm store={store} /></Panel>
        </>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Your profile"><ProfileForm name={me.name} phone={me.phone ?? ''} email={me.email} /></Panel>
        <Panel title="Your password"><PasswordForm /></Panel>
      </div>
    </div>
  )
}
