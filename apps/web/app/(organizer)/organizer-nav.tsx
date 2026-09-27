"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@workspace/ui/components/navigation-menu"

const links = [
  { href: "/campeonatos", label: "Campeonatos" },
  { href: "/modalidades", label: "Modalidades" },
]

export function OrganizerNav() {
  const pathname = usePathname()

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {links.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink
              render={<Link href={link.href} />}
              active={pathname.startsWith(link.href)}
            >
              {link.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
