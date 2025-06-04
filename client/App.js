import { useReducer } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { View, Image, Text } from "react-native";
import { MyDispatchContext, MyUserContext } from './contexts/Contexts';
import MyUserReducer from './reducers/MyUserReducer';
import { LikedRoomsProvider } from "./contexts/LikedRoomsContext";
import { SearchProvider } from './contexts/SearchContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

import Home from "./components/Home/Home";
import Rooms from "./components/Rooms/Rooms";
import PersonalPage from "./components/PersonalPage/PersonalPage";
import HomeQR from "./components/Home/HomeQR";
import HomePersonal from "./components/Home/HomePersonal";
import HomeNotification from "./components/Home/HomeNotification";
import HomeChat from './components/Home/HomeChat';
import ChangePassword from './components/Home/ChangePassword';
import ChangePersonal from './components/Home/ChangePersonal';
import Login from './components/User/Login';
import Register from './components/User/Register';
import HomeCreen from "./components/HomeScreen/HomeScreen";
import ForgotPassword from './components/User/ForgotPassword';
import RoomDetails from './components/Rooms/RoomDetails';
import RegisterChangeRoom from './components/Rooms/RegisterChangeRoom';
import RoomsStatus from "./components/Rooms/RoomStatus";
import ExtensionsPayBills from './components/PersonalPage/ExtensionsPayBills';
import ExtensionsPayBillsDetails from './components/PersonalPage/ExtensionsPayBillsDetails';
import ExtensionsFavouriteRoom from './components/PersonalPage/ExtensionsFavouriteRoom';
import ExtensionsNoticeOfAbsence from './components/PersonalPage/ExtensionsNoticeOfAbsence';
import ExtensionsServiceSurvey from './components/PersonalPage/ExtensionsServiceSurvey';
import ExtensionsServiceSurveyDetail from './components/PersonalPage/ExtensionsServiceSurveyDetail';
import RepairSupport from './components/PersonalPage/RepairSupport';
import RepairSupportDetails from './components/PersonalPage/RepairSupportDetails';
import ReportSupport from "./components/PersonalPage/ReportSupport";
import ReportSupportDetail from "./components/PersonalPage/ReportSupportDetail";

const Tab = createBottomTabNavigator();
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home") iconName = "home";
          else if (route.name === "Rooms") iconName = "office-building";
          else if (route.name === "PersonalPage") iconName = "account";

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: "#1E319D",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Rooms" component={Rooms} />
      <Tab.Screen name="PersonalPage" component={PersonalPage} />
    </Tab.Navigator>
  );
};


const Stack = createNativeStackNavigator();
const StackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="homescreen">
      <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="homescreen" component={HomeCreen} options={{ headerShown: false }} />
      <Stack.Screen name="login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="register" component={Register} options={{ headerShown: false }} />
      <Stack.Screen name="homepersonal" component={HomePersonal} options={{ headerShown: false }} />
      <Stack.Screen name="forgotPassword"
        component={ForgotPassword}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#E3C7A5",
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1741062641/gyjdx9ztcqt6arxyb1al.png' }}
                style={{ width: 30, height: 30, marginRight: 8 }}
              />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                Quên mật khẩu
              </Text>
            </View>
          ),
        }} />

      <Stack.Screen
        name="homeqr"
        component={HomeQR}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="homechat"
        component={HomeChat}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#E3C7A5",
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1741062641/gyjdx9ztcqt6arxyb1al.png' }}
                style={{ width: 30, height: 30, marginRight: 8 }}
              />
              <Text style={{ color: '#E3C7A5', fontSize: 18, fontWeight: 'bold' }}>
                Cú Mèo Thám Tử
              </Text>
            </View>
          ),
        }}
      />

      <Stack.Screen
        name="homenotification"
        component={HomeNotification}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#E3C7A5",
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: 'https://res.cloudinary.com/dywyrpfw7/image/upload/v1741062641/gyjdx9ztcqt6arxyb1al.png' }}
                style={{ width: 30, height: 30, marginRight: 8 }}
              />
              <Text style={{ color: '#E3C7A5', fontSize: 18, fontWeight: 'bold' }}>
                Cú Mèo Thông Báo
              </Text>
            </View>
          ),
        }}
      />

      <Stack.Screen
        name="changePassword"
        component={ChangePassword}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Cập nhật mật khẩu
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name="changePersonal"
        component={ChangePersonal}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#E3C7A5",
          headerTitle: () => (
            <Text style={{ color: '#E3C7A5', fontSize: 18, fontWeight: 'bold' }}>
              Cập nhật thông tin cá nhân
            </Text>
          ),
        }}
      />

      <Stack.Screen name="rooms" component={Rooms} />

      <Stack.Screen
        name="roomDetails"
        component={RoomDetails}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Thông tin chi tiết phòng
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name="roomRegister"
        component={RegisterChangeRoom}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Điền vào mẫu đổi phòng
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="roomStatus"
        component={RoomsStatus}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Yêu cầu đổi phòng
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name="payBills"
        component={ExtensionsPayBills}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Thanh toán hóa đơn
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name="extensionsPayBillsDetails"
        component={ExtensionsPayBillsDetails}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                Thanh toán hóa đơn
              </Text>
            </View>
          ),
        }}
      />

      <Stack.Screen
        name="extensionsFavouriteRoom"
        component={ExtensionsFavouriteRoom}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Danh sách phòng yêu thích
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="extensionsNoticeOfAbsence"
        component={ExtensionsNoticeOfAbsence}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#E3C7A5",
          headerTitle: () => (
            <Text style={{ color: '#E3C7A5', fontSize: 18, fontWeight: 'bold' }}>
              Thông báo vắng
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="extensionsServiceSurvey"
        component={ExtensionsServiceSurvey}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Khảo sát dịch vụ
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name="extensionsServiceSurveyDetail"
        component={ExtensionsServiceSurveyDetail}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#E3C7A5",
          headerTitle: () => (
            <Text style={{ color: '#E3C7A5', fontSize: 18, fontWeight: 'bold' }}>
              Chi tiết khảo sát dịch vụ
            </Text>
          ),
        }}
      />


      <Stack.Screen
        name="repairSupport"
        component={RepairSupport}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Yêu cầu sửa chữa
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="repairSupportDetails"
        component={RepairSupportDetails}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Điền vào mẫu yêu cầu sửa chữa
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="reportSupport"
        component={ReportSupport}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Báo cáo sự cố
            </Text>
          ),
        }}
      />

      <Stack.Screen
        name="reportSupportDetail"
        component={ReportSupportDetail}
        options={{
          headerStyle: { backgroundColor: "#1E319D", height: 100 },
          headerTintColor: "#fff",
          headerTitle: () => (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Điền vào mẫu báo cáo sự cố
            </Text>
          ),
        }}
      />
    </Stack.Navigator>
  );
};


const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <LikedRoomsProvider>
          <SearchProvider>
            <WebSocketProvider>
              <NavigationContainer>
                <StackNavigator />
              </NavigationContainer>
            </WebSocketProvider>
          </SearchProvider>
        </LikedRoomsProvider>
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
};

export default App;
