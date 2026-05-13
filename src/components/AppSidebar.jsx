import { useNavigate, NavLink } from 'react-router-dom'
import {
  Home, FileText, Shield, DollarSign, CreditCard,
  HelpCircle, Settings, LogOut, Car,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarHeader, SidebarRail,
} from '@/components/ui/sidebar'
import { LogoFull, LogoIcon } from '@/components/Logo'
import { useSidebar } from '@/components/ui/sidebar'

const NAV_MAIN = [
  { to: '/dashboard',                        icon: Home,         label: 'Home'            },
  { to: '/dashboard/cotizaciones',           icon: FileText,     label: 'Cotizaciones'    },
  { to: '/dashboard/mis-polizas',            icon: Shield,       label: 'Mis pólizas'     },
  { to: '/dashboard/mis-pagos',              icon: DollarSign,   label: 'Mis pagos'       },
  { to: '/dashboard/informacion-financiera', icon: CreditCard,   label: 'Info. financiera'},
]

const NAV_BOTTOM = [
  { icon: HelpCircle, label: 'Soporte'        },
  { icon: Settings,   label: 'Configuración'  },
]

function SidebarLogoHeader() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  return (
    <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
      <div className="flex items-center gap-2 overflow-hidden">
        <LogoIcon size={26} />
        {!collapsed && <LogoFull className="h-7" />}
      </div>
    </SidebarHeader>
  )
}

export function AppSidebar() {
  const navigate = useNavigate()

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarLogoHeader />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_MAIN.map(({ to, icon: Icon, label }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild tooltip={label}>
                    <NavLink
                      to={to}
                      end={to === '/dashboard'}
                      className={({ isActive }) =>
                        isActive ? 'bg-sidebar-accent text-[#2D2A7A] font-semibold' : ''
                      }
                    >
                      <Icon />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Botón cotizar */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Iniciar cotización"
                  onClick={() => navigate('/dashboard/cotizar')}
                  className="bg-[#2D2A7A] text-white hover:bg-[#201D5F] hover:text-white font-bold"
                >
                  <Car />
                  <span>Iniciar cotización</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {NAV_BOTTOM.map(({ icon: Icon, label }) => (
            <SidebarMenuItem key={label}>
              <SidebarMenuButton tooltip={label}>
                <Icon />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cerrar sesión"
              onClick={() => navigate('/login')}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
