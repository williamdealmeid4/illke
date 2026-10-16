const required = 1024n | 2048n | 16384n;
export function canPublish(channel, roles, member, guildId) {
  let permissions = roles
    .filter((r) => r.id === guildId || member.roles.includes(r.id))
    .reduce((p, r) => p | BigInt(r.permissions), 0n);
  if (permissions & 8n) return true;
  const overwrites = channel.permission_overwrites || [];
  const everyone = overwrites.find((o) => o.id === guildId);
  if (everyone)
    permissions =
      (permissions & ~BigInt(everyone.deny)) | BigInt(everyone.allow);
  let deny = 0n,
    allow = 0n;
  for (const o of overwrites.filter((o) => member.roles.includes(o.id))) {
    deny |= BigInt(o.deny);
    allow |= BigInt(o.allow);
  }
  permissions = (permissions & ~deny) | allow;
  const own = overwrites.find((o) => o.id === member.user.id);
  if (own) permissions = (permissions & ~BigInt(own.deny)) | BigInt(own.allow);
  return (permissions & required) === required;
}
