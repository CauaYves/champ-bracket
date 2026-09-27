import Link from "next/link"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"

export function PageBreadcrumb({
  items,
  page,
}: {
  items: { label: string; href: string }[]
  page: string
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item) => (
          <Fragment key={item.href}>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={item.href} />}>
                {item.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
