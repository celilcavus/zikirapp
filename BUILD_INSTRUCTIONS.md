# APK Derleme Talimatları

Bu Expo uygulaması için APK oluşturmak için aşağıdaki adımları izleyin:

## Yöntem 1: EAS Build (Önerilen - Bulut Derleme)

1. **Expo hesabı oluşturun:**
   - Web tarayıcınızda https://expo.dev adresine gidin
   - "Sign Up" butonuna tıklayın
   - E-posta adresiniz veya GitHub hesabınızla kayıt olun
   - (Alternatif: Terminal'de `npx eas-cli login` komutunu çalıştırıp kayıt seçeneğini seçebilirsiniz)

2. **EAS CLI'ye giriş yapın:**
   ```
   npx eas-cli login
   ```
   E-posta ve şifrenizi girin.

2. **APK oluşturun:**
   ```
   npx eas-cli build --platform android --profile preview
   ```

3. Derleme tamamlandığında, APK dosyasını EAS dashboard'dan indirebilirsiniz.

## Yöntem 2: Yerel Derleme (Sınırsız ve Ücretsiz - Android Studio Gerekli)

### Adım 1: Native Android klasörlerini oluşturun (Sadece bir kez)
```
npx expo prebuild --platform android
```
Bu komut `android` klasörünü oluşturur. Bir kez çalıştırmanız yeterlidir.

### Adım 2: APK oluşturun (İki yöntem)

#### Yöntem A: Android Studio ile (Görsel Arayüz)
1. Android Studio'yu açın
2. `File > Open` seçeneğini kullanın
3. `android` klasörünü seçin
4. `Build > Build Bundle(s) / APK(s) > Build APK(s)` seçeneğini kullanın
5. APK dosyası `android/app/build/outputs/apk/release/` klasöründe olacaktır

#### Yöntem B: Terminal ile (Komut Satırı)
Windows PowerShell'de:
```powershell
cd android
.\gradlew.bat assembleRelease
```
veya Git Bash/CMD'de:
```bash
cd android
gradlew assembleRelease
```

APK dosyası `android/app/build/outputs/apk/release/` klasöründe olacaktır.

**Not:** Bu yöntemle istediğiniz kadar build alabilirsiniz, sınırsızdır!

## Notlar

- EAS Build için ücretsiz Expo hesabı yeterlidir
- **ÖNEMLİ:** Her build (başarılı veya başarısız) bir hak sayılır. Aynı uygulamaya tekrar build alırsanız, her build bir hak kullanır.
- Build almadan önce uygulamanızı yerel olarak test etmeniz önerilir (`npm start` ile)
- Yerel derleme (Yöntem 2) sınırsız ve ücretsizdir, ancak Android Studio kurulumu gerektirir
- İlk derleme biraz zaman alabilir

