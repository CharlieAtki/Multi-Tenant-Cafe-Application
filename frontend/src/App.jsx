import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MarketplacePage from './pages/marketplacePage';
import AccountCreationForm from './pages/accountCreationPage';
import LoginForm from './components/accountLoginForm';
import CheckoutPage from './pages/checkoutPage';
import BusinessDashboardPage from './pages/businessDashboardPage';
import BusinessCreationPage from './pages/businessCreationPage';
import BusinessProductCreation from './components/businessDashboardSubComponents/businessProductCreation';
import ProductViewPage from './pages/productViewPage';
import AgentChatPage from './pages/agentChatPage';
import LandingPage from './pages/landingPage';
import BusinessAnalyticsGrid from './components/businessDashboardSubComponents/businessAnalyticsGrid';
import BusinessOrderGrid from './components/businessDashboardSubComponents/businessOrderGird';

const App = ( ) => {
	return (
		<Router>
			<Routes>
				<Route path='/marketplace' element={ <MarketplacePage /> } />
				<Route path='/productView' element={ <ProductViewPage /> } />
				<Route path='/accountCreation' element={ <AccountCreationForm /> } />
				<Route path='/accountLogin' element={ <LoginForm /> } />
				<Route path='checkout' element={ <CheckoutPage /> } />
				<Route path='/agent' element={ <AgentChatPage /> } />

				{/* ✅ Nested dashboard layout with children */}
				<Route path='/businessDashboard' element={<BusinessDashboardPage />}>
					<Route path='createProduct' element={<BusinessProductCreation />} />
					<Route path='analytics' element={<BusinessAnalyticsGrid />} />
					<Route path='orders' element={ <BusinessOrderGrid /> } />
					{/* Add more nested routes here */}
				</Route>

				<Route path='/businessCreation' element={ <BusinessCreationPage /> } />

				<Route path='/' element={ <LandingPage /> } />
			</Routes>
		</Router>
 	)
}

export default App;
