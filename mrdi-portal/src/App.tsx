import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import MdmLayout from './components/layout/MdmLayout'
import CimrmsLayout from './components/layout/CimrmsLayout'
import CimimsLayout from './components/layout/CimimsLayout'
import PermLayout from './components/layout/PermLayout'
import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'
import LoginPage from './pages/Login'
import ProfilePage from './pages/Profile'
import SpcTrend from './pages/SpcTrend'
import Alarms from './pages/Alarms'
import Handover from './pages/Handover'
import MdmDashboard from './pages/mdm/MdmDashboard'
import MdmUsers from './pages/mdm/MdmUsers'
import MdmRoles from './pages/mdm/MdmRoles'
import MdmTodos from './pages/mdm/MdmTodos'
import MdmAudit from './pages/mdm/MdmAudit'
import MdmLoginAudit from './pages/mdm/MdmLoginAudit'
import MdmSettings from './pages/mdm/MdmSettings'
import MdmSystems from './pages/mdm/MdmSystems'
import MdmApiKeys from './pages/mdm/MdmApiKeys'
import MdmAccessMatrix from './pages/mdm/MdmAccessMatrix'
import MdmPermissionApi from './pages/mdm/MdmPermissionApi'
import CimrmsDashboard from './pages/cimrms/CimrmsDashboard'
import CimrmsRequests from './pages/cimrms/CimrmsRequests'
import CimrmsRequestsNew from './pages/cimrms/CimrmsRequestsNew'
import CimrmsRequestDetail from './pages/cimrms/CimrmsRequestDetail'
import CimrmsPool from './pages/cimrms/CimrmsPool'
import CimrmsTodos from './pages/cimrms/CimrmsTodos'
import CimrmsAudit from './pages/cimrms/CimrmsAudit'
import CimrmsExceptions from './pages/cimrms/CimrmsExceptions'
import CimrmsSettings from './pages/cimrms/CimrmsSettings'
import CimimsDashboard from './pages/cimims/CimimsDashboard'
import CimimsIncidents from './pages/cimims/CimimsIncidents'
import CimimsIncidentsNew from './pages/cimims/CimimsIncidentsNew'
import CimimsIncidentDetail from './pages/cimims/CimimsIncidentDetail'
import CimimsDutyPool from './pages/cimims/CimimsDutyPool'
import CimimsTodos from './pages/cimims/CimimsTodos'
import CimimsAudit from './pages/cimims/CimimsAudit'
import CimimsExceptions from './pages/cimims/CimimsExceptions'
import CimimsSettings from './pages/cimims/CimimsSettings'
import PermDashboard from './pages/perm/PermDashboard'
import PermList from './pages/perm/PermList'
import PermNew from './pages/perm/PermNew'
import PermDetail from './pages/perm/PermDetail'
import PermTypes from './pages/perm/PermTypes'
import PermTodos from './pages/perm/PermTodos'
import PermAudit from './pages/perm/PermAudit'
import PermExpiring from './pages/perm/PermExpiring'
import PermSettings from './pages/perm/PermSettings'
import { useAuthStore } from './store/authStore'

// 路由守卫：未登录 → 登录页
// token 为空（must_change_password=true）→ /profile 强制改密
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  const token = useAuthStore(s => s.token)
  if (!user) return <Navigate to="/login" replace />
  // token 为空字符串 → 用户需要强制改密
  if (!token) return <Navigate to="/profile" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />

        {/* Portal Shell */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="spc" element={<SpcTrend />} />
          <Route path="alarms" element={<Alarms />} />
          <Route path="handover" element={<Handover />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* MDM Shell */}
        <Route path="mdm" element={<RequireAuth><MdmLayout /></RequireAuth>}>
          <Route index element={<MdmDashboard />} />
          <Route path="users" element={<MdmUsers />} />
          <Route path="roles" element={<MdmRoles />} />
          <Route path="todos" element={<MdmTodos />} />
          <Route path="audit" element={<MdmAudit />} />
          <Route path="login-audit" element={<MdmLoginAudit />} />
          <Route path="settings" element={<MdmSettings />} />
          <Route path="systems" element={<MdmSystems />} />
          <Route path="api-keys" element={<MdmApiKeys />} />
          <Route path="access-matrix" element={<MdmAccessMatrix />} />
          <Route path="permission-api" element={<MdmPermissionApi />} />
          <Route path="*" element={<Navigate to="/mdm" replace />} />
        </Route>

        {/* CIM-RMS Shell */}
        <Route path="cimrms" element={<RequireAuth><CimrmsLayout /></RequireAuth>}>
          <Route index element={<CimrmsDashboard />} />
          <Route path="dashboard" element={<CimrmsDashboard />} />
          <Route path="requests" element={<CimrmsRequests />} />
          <Route path="requests/new" element={<CimrmsRequestsNew />} />
          <Route path="requests/:id" element={<CimrmsRequestDetail />} />
          <Route path="pool" element={<CimrmsPool />} />
          <Route path="todos" element={<CimrmsTodos />} />
          <Route path="audit" element={<CimrmsAudit />} />
          <Route path="exceptions" element={<CimrmsExceptions />} />
          <Route path="settings" element={<CimrmsSettings />} />
          <Route path="*" element={<Navigate to="/cimrms" replace />} />
        </Route>

        {/* CIM-IMS Shell */}
        <Route path="cimims" element={<RequireAuth><CimimsLayout /></RequireAuth>}>
          <Route index element={<CimimsDashboard />} />
          <Route path="dashboard" element={<CimimsDashboard />} />
          <Route path="incidents" element={<CimimsIncidents />} />
          <Route path="incidents/new" element={<CimimsIncidentsNew />} />
          <Route path="incidents/:id" element={<CimimsIncidentDetail />} />
          <Route path="duty-pool" element={<CimimsDutyPool />} />
          <Route path="todos" element={<CimimsTodos />} />
          <Route path="audit" element={<CimimsAudit />} />
          <Route path="exceptions" element={<CimimsExceptions />} />
          <Route path="settings" element={<CimimsSettings />} />
          <Route path="*" element={<Navigate to="/cimims" replace />} />
        </Route>

        {/* CIM-PERM Shell */}
        <Route path="perm" element={<RequireAuth><PermLayout /></RequireAuth>}>
          <Route index element={<PermDashboard />} />
          <Route path="perm" element={<PermList />} />
          <Route path="perm/new" element={<PermNew />} />
          <Route path="perm/:id" element={<PermDetail />} />
          <Route path="perm-types" element={<PermTypes />} />
          <Route path="todos" element={<PermTodos />} />
          <Route path="audit" element={<PermAudit />} />
          <Route path="expiring-soon" element={<PermExpiring />} />
          <Route path="settings" element={<PermSettings />} />
          <Route path="*" element={<Navigate to="/perm" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
