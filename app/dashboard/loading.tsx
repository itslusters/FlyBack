import React from 'react'

function Bone({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={['animate-pulse rounded-lg bg-neutral-100', className].join(' ')} style={style} />
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-16" />
        <Bone className="h-6 w-20" />
      </div>
      {/* Flight identity */}
      <div className="mt-5 space-y-2">
        <Bone className="h-4 w-28" />
        <Bone className="h-3 w-36" />
      </div>
      {/* Route timeline */}
      <div className="my-5 flex items-center gap-3">
        <div className="space-y-1.5">
          <Bone className="h-7 w-12" />
          <Bone className="h-2 w-10" />
        </div>
        <Bone className="h-px flex-1 rounded-none" />
        <div className="space-y-1.5 text-right">
          <Bone className="h-7 w-12" />
          <Bone className="h-2 w-10" />
        </div>
      </div>
      {/* Perforation */}
      <Bone className="my-4 h-px w-full rounded-none" />
      {/* Amount */}
      <div className="space-y-1.5">
        <Bone className="h-2 w-20" />
        <Bone className="h-8 w-16" />
        <Bone className="h-2 w-28" />
      </div>
      {/* Footer */}
      <Bone className="mt-4 h-2 w-20" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-12 flex items-start justify-between gap-6">
          <div className="space-y-3">
            <Bone className="h-3.5 w-40" />
            <Bone className="h-3 w-48" />
            <Bone className="h-16 w-52" />
            <Bone className="h-3 w-28" />
          </div>
          <Bone className="h-10 w-36 shrink-0" />
        </div>

        {/* Filter tabs */}
        <div className="mb-8 flex gap-2">
          {[56, 68, 76, 112].map((w, i) => (
            <Bone key={i} className="h-8" style={{ width: w } as React.CSSProperties} />
          ))}
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>

      </div>
    </div>
  )
}
