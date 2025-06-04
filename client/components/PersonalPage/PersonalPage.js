import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import styles from './StylePersonalPage';

const ParsonalPage = () => {
    const nav = useNavigation();

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Image
                        source={{
                            uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744443009/fqc9yrpspqnkvwlk2zek.png",
                        }}
                        style={styles.logo}
                    />
                    <Text style={styles.slogan}>Your experience is our experience too</Text>
                </View>

                <View style={styles.searchBar}>
                    <TouchableOpacity onPress={() => nav.navigate("homepersonal")}>
                        <Image
                            source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744530660/a22aahwkjiwomfmvvmaj.png" }}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>
                    <View style={styles.rightIcons}>
                        <TouchableOpacity onPress={() => nav.navigate("homeqr")}>
                            <Image
                                source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744536313/jzzudtnakfmkygcfdaw1.png" }}
                                style={styles.imgIcon}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => nav.navigate("homechat")}>
                            <Image
                                source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1744536313/h8ur4we2qjw5fss9s4la.png" }}
                                style={styles.imgIcon}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tiện ích</Text>
                    </View>
                    <View style={styles.grid}>
                        <View>
                            <TouchableOpacity onPress={() => nav.navigate("extensionsServiceSurvey")}>
                                <View style={styles.gridItem}>
                                    <Image
                                        source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1745889567/KTX-SV/wtxxnfhkzbjkolsenqwv.png" }}
                                        style={styles.imgIcon}
                                    />
                                    <Text style={styles.itemText}>Khảo sát</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => nav.navigate("payBills")}>
                                <View style={styles.gridItem}>
                                    <Image
                                        source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1745909869/KTX-SV/wcfq6ald0jcdhqqhob9z.png" }}
                                        style={styles.imgIcon}
                                    />
                                    <Text style={styles.itemText}>Thanh toán</Text>
                                </View>
                            </TouchableOpacity>
                        </View>


                        <View>                   
                            <TouchableOpacity onPress={() => nav.navigate("extensionsFavouriteRoom")}>
                                <View style={styles.gridItem}>
                                    <Image
                                        source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1745889549/KTX-SV/ahqohk9uqeugwvrodwvt.png" }}
                                        style={styles.imgIcon}
                                    />
                                    <Text style={styles.itemText}>Phòng yêu thích</Text>
                                </View>
                            </TouchableOpacity>
                             {/* <TouchableOpacity onPress={() => nav.navigate("extensionsNoticeOfAbsence")}>
                                <View style={styles.gridItem}>
                                    <Image
                                        source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1745889789/KTX-SV/lxyncotabeo15y8vu5v1.png" }}
                                        style={styles.imgIcon}
                                    />
                                    <Text style={styles.itemText}>Xin vắng</Text>
                                </View>
                            </TouchableOpacity> */}
                        </View>

                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Hỗ trợ</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <TouchableOpacity style={styles.item} onPress={() => nav.navigate("reportSupport")}>
                            <Image
                                source={{ uri: "https://res.cloudinary.com/dywyrpfw7/image/upload/v1745889742/KTX-SV/rwbff3sgja7fghxi833l.png" }}
                                style={styles.imgIcon}
                            />
                            <Text style={styles.itemText}>Hỗ trợ sự cố</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

        </View>
    );
};

export default ParsonalPage;