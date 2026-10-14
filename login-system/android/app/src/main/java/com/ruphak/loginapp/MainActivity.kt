package com.ruphak.loginapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.ruphak.loginapp.theme.LoginAppTheme

// Demo credentials for this sample (no server involved).
private const val DEMO_USERNAME = "admin"
private const val DEMO_PASSWORD = "admin123"

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    enableEdgeToEdge()
    setContent {
      LoginAppTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { LoginApp() }
      }
    }
  }
}

@Composable
fun LoginApp() {
  var loggedInUser by rememberSaveable { mutableStateOf<String?>(null) }

  val user = loggedInUser
  if (user == null) {
    LoginScreen(onLoginSuccess = { loggedInUser = it })
  } else {
    WelcomeScreen(username = user, onLogout = { loggedInUser = null })
  }
}

@Composable
fun LoginScreen(onLoginSuccess: (String) -> Unit) {
  var username by rememberSaveable { mutableStateOf("") }
  var password by rememberSaveable { mutableStateOf("") }
  var error by rememberSaveable { mutableStateOf<String?>(null) }

  Column(
    modifier = Modifier.fillMaxSize().safeDrawingPadding().padding(24.dp),
    verticalArrangement = Arrangement.Center,
  ) {
    Text("Login", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
    Text("Sign in to continue", color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(32.dp))

    OutlinedTextField(
      value = username,
      onValueChange = { username = it; error = null },
      label = { Text("Username") },
      singleLine = true,
      modifier = Modifier.fillMaxWidth(),
    )
    Spacer(Modifier.height(12.dp))

    OutlinedTextField(
      value = password,
      onValueChange = { password = it; error = null },
      label = { Text("Password") },
      singleLine = true,
      visualTransformation = PasswordVisualTransformation(),
      modifier = Modifier.fillMaxWidth(),
    )

    error?.let {
      Spacer(Modifier.height(8.dp))
      Text(it, color = MaterialTheme.colorScheme.error)
    }
    Spacer(Modifier.height(24.dp))

    Button(
      onClick = {
        error =
          when {
            username.isBlank() || password.isEmpty() -> "Please enter username and password"
            username.trim() == DEMO_USERNAME && password == DEMO_PASSWORD -> null
            else -> "Invalid username or password"
          }
        if (error == null) onLoginSuccess(username.trim())
      },
      modifier = Modifier.fillMaxWidth().height(50.dp),
    ) {
      Text("Login")
    }
    Spacer(Modifier.height(16.dp))
    Text(
      "Demo login: $DEMO_USERNAME / $DEMO_PASSWORD",
      style = MaterialTheme.typography.bodySmall,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
      modifier = Modifier.align(Alignment.CenterHorizontally),
    )
  }
}

@Composable
fun WelcomeScreen(username: String, onLogout: () -> Unit) {
  Column(
    modifier = Modifier.fillMaxSize().safeDrawingPadding().padding(24.dp),
    verticalArrangement = Arrangement.Center,
    horizontalAlignment = Alignment.CenterHorizontally,
  ) {
    Text("Login successful!", color = MaterialTheme.colorScheme.primary)
    Text("Welcome, $username", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(32.dp))
    OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth().height(50.dp)) { Text("Logout") }
  }
}

@Preview(showBackground = true)
@Composable
private fun LoginScreenPreview() {
  LoginAppTheme { LoginScreen(onLoginSuccess = {}) }
}
