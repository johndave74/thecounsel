import { formatDistanceToNow } from 'date-fns'
import { Users } from 'lucide-react'
import { useMembers } from '@/features/administration/hooks/use-administration'
import { CreateUserDialog } from '@/features/administration/components/create-user-dialog'
import { initialsOf } from '@/shared/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function MembersPanel({ organizationId }: { organizationId: string }) {
  const members = useMembers(organizationId)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-4 w-4 text-muted-foreground" /> Members
        </CardTitle>
        <CreateUserDialog organizationId={organizationId} />
      </CardHeader>
      <CardContent>
        {members.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : members.data && members.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} alt="" />}
                        <AvatarFallback>{initialsOf(m.profile?.full_name ?? m.profile?.email)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.profile?.full_name ?? '—'}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.profile?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.role?.name ?? '—'}</span>
                      {m.is_owner && <Badge variant="default">Owner</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.status === 'active' ? 'success' : 'muted'}>{m.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.joined_at ? formatDistanceToNow(new Date(m.joined_at), { addSuffix: true }) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No members yet. Add your first user to get started.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
