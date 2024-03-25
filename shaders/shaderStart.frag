#version 410 core

in vec3 fNormal;
in vec4 fPosEye;
in vec2 fTexCoords;
in vec4 fragPosLightSpace;

in vec3 vertPos;

out vec4 fColor;

//lighting
uniform	vec3 lightDir;
uniform	vec3 lightColor;

//texture
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;
uniform sampler2D shadowMap;

vec3 ambient;
float ambientStrength = 0.2f;
vec3 diffuse;
vec3 specular;
float specularStrength = 0.5f;
float shininess = 32.0f;
float shadow;

vec3 ambientPoint;
vec3 diffusePoint;
vec3 specularPoint;

uniform float fogDensity;

float constant = 1.0f;
float linear = 0.0045f;
float quadratic = 0.0075f;

vec3 computeLightComponents()
{		
	ambient = vec3(0.0f); 
	diffuse = vec3(0.0f);
	specular = vec3(0.0f);

 
	vec3 cameraPosEye = vec3(0.0f);//in eye coordinates, the viewer is situated at the origin
	
	//transform normal
	vec3 normalEye = normalize(fNormal);	
	
	//compute light direction
	vec3 lightDirN = normalize(lightDir);
	
	//compute view direction 
	vec3 viewDirN = normalize(cameraPosEye - fPosEye.xyz);
		
	//compute ambient light
	ambient = ambientStrength * lightColor;
	
	//compute diffuse light
	diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;
	
	//compute specular light
	vec3 reflection = reflect(-lightDirN, normalEye);
	float specCoeff = pow(max(dot(viewDirN, reflection), 0.0f), shininess);
	specular = specularStrength * specCoeff * lightColor;

	ambient *= texture(diffuseTexture, fTexCoords).rgb;
	diffuse *= texture(diffuseTexture, fTexCoords).rgb;
	specular *= texture(specularTexture, fTexCoords).rgb;

	return (ambient + diffuse + specular); 
}

float computeShadow()
{
	// perform perspective divide
	vec3 normalizedCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
	
	// Transform to [0,1] range
	normalizedCoords = normalizedCoords * 0.5 + 0.5;
	
	if (normalizedCoords.z > 1.0f)
		return 0.0f;
	
	// Get closest depth value from light's perspective
	float closestDepth = texture(shadowMap, normalizedCoords.xy).r;
	
	// Get depth of current fragment from light's perspective
	float currentDepth = normalizedCoords.z;
	
	// Check whether current frag pos is in shadow
	float bias = 0.005f;
	float shadow = currentDepth - bias > closestDepth ? 1.0f : 0.0f;
	
	return shadow;
}

float computeFog()
{
 //float fogDensity = 0.05f;
 float fragmentDistance = length(fPosEye);
 float fogFactor = exp(-pow(fragmentDistance * fogDensity, 2));

 return clamp(fogFactor, 0.0f, 1.0f);
}

vec3 luminaPoint(vec3 pos, vec3 color)
{

	
	vec3 normalEye = normalize(fNormal);
	vec3 lightDirN = normalize(pos-vertPos.xyz);
	vec3 viewDirN = normalize(-fPosEye.xyz); 
	
	float lungime = length(pos-vertPos.xyz);
	float att = 1.0f / (constant + linear * lungime + quadratic * (lungime * lungime));
	//compute ambient light
	ambientPoint = att * ambientStrength * color;
	//compute diffuse light
	diffusePoint = att * max(dot(normalEye, lightDirN), 0.0f) * color;

	vec3 reflection = reflect(-lightDirN, normalEye);
	float specCoeff = pow(max(dot(viewDirN, reflection), 0.0f), shininess);
	specularPoint = att * specularStrength * specCoeff * color;

	ambientPoint *= texture(diffuseTexture, fTexCoords).rgb;
	diffusePoint *= texture(diffuseTexture, fTexCoords).rgb;
	specularPoint *= texture(specularTexture, fTexCoords).rgb;

	return (ambientPoint + diffusePoint + specularPoint); 
			
}


void main() 
{
	vec3 color = vec3(0.0);

	vec3 pointPosition = vec3 (-181.22f, 31.2f, -195.09f);
	vec3 lightColorPoint = vec3 (0.9f, 0.35f, 0.0f); 

	
	
	vec3 colorDirectional = computeLightComponents();
	

	vec3 colorPoint = luminaPoint(pointPosition, lightColorPoint);
	

	//modulate with shadow           !!!
	shadow = computeShadow();
	colorDirectional = min((ambient + (1.0f - shadow)*diffuse) + (1.0f - shadow)*specular, 1.0f);
    	colorPoint = min((ambientPoint + (1.0f - shadow)*diffusePoint) + (1.0f - shadow)*specularPoint, 1.0f);
	color = colorDirectional + colorPoint;
    	float fogFactor = computeFog();
	vec4 fogColor = vec4(0.5f, 0.5f, 0.5f, 1.0f);
	fColor = mix(fogColor, vec4(color, 1.0f), fogFactor);
}
