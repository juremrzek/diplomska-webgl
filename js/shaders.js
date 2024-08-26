const vertex = `#version 300 es
    uniform mat4 uMvpMatrix;
    uniform vec3 uLightDirection;

    in vec4 aPosition;
    in vec3 aNormal;

    out vec3 vNormal;
    out vec3 vLightDirection;
    out vec3 vBaseColor;
    out vec4 vPosition;

    vec3 baseColor = vec3(0, 1, 0); //TODO: get color from .obj file
    
    void main(){
        vNormal = normalize(mat3(uMvpMatrix)*aNormal);
        gl_Position = uMvpMatrix*aPosition;
        vLightDirection = normalize(uLightDirection);
        vBaseColor = baseColor;
        vPosition = gl_Position;
    }
`;
const fragment = `#version 300 es
    precision mediump float;

    in vec3 vNormal;
    in vec3 vLightDirection;
    in vec3 vBaseColor;
    in vec4 vPosition;

    out vec4 oColor;

    vec3 ambientColor = vec3(0.05, 0.05, 0.05);
    vec3 diffuseColor = vec3(0.8, 0.8, 0.8);

    vec3 specularColor = vec3(0.9, 0.9, 0.9);
    float specularExp = 80.0;
    vec3 lightColor = vec3(1, 1, 1);

    vec3 getReflection(vec3 lightDirection, vec3 normal){
        return 2.0*dot(lightDirection, normal)*normal - lightDirection;
    }

    void main(){
        vec3 reflection = -normalize(getReflection(vLightDirection, vNormal));
        vec3 eye = normalize(vec3(vPosition));

        vec3 baseColor = vBaseColor;
        vec3 ambient = baseColor * ambientColor;
        vec3 diffuse = baseColor * max(dot(vLightDirection, vNormal), 0.0) * diffuseColor;
        vec3 specular = lightColor*specularColor*pow(max(dot(reflection, eye), 0.0), specularExp);
        oColor = vec4(ambient + diffuse + specular, 1);
        //oColor = vec4(specular, 1);
        oColor.a = 1.0;
    }
`;
export const shaders = {
    shader1: { vertex, fragment }
};